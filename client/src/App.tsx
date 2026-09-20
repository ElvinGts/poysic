/**
 * client/src/App.tsx
 * Tujuan: Komponen aplikasi utama PoySic yang menghubungkan Socket.IO, ClockSync, SyncedAudio, dan antara muka pengguna modular.
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { socket } from './lib/socket';
import { ClockSync } from './lib/sync';
import { SyncedAudio } from './lib/audio';
import { Track, Participant, SyncStats, ChatMessage, ReactionEvent, RoomState } from './types';
import { CURATED_TRACKS } from './data/curatedTracks';
import { Navbar } from './components/ui/Navbar';
import { LandingView } from './components/ui/LandingView';
import { PlayerView } from './components/ui/PlayerView';
import { DocsModal } from './components/ui/DocsModal';
import { DonationModal } from './components/ui/DonationModal';
import { UsernameModal } from './components/ui/UsernameModal';

export default function App() {
  // Maklumat bilik & pengguna
  const [roomId, setRoomId] = useState<string | null>(null);
  const [username, setUsername] = useState<string>(() => {
    return localStorage.getItem('poysic_username') || 'Pendengar PoySic';
  });
  const [avatar, setAvatar] = useState<string>(() => {
    return localStorage.getItem('poysic_avatar') || '🎧';
  });
  const [isHost, setIsHost] = useState<boolean>(false);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [isUsernameModalOpen, setIsUsernameModalOpen] = useState<boolean>(false);

  // Keadaan pemain audio
  const [currentTrack, setCurrentTrack] = useState<Track | null>(CURATED_TRACKS[0]);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(185);
  const [queue, setQueue] = useState<Track[]>(CURATED_TRACKS.slice(1, 4));
  const [volume, setVolume] = useState<number>(0.85);
  const [isMuted, setIsMuted] = useState<boolean>(false);

  // Komunikasi & Reaksi
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [reactions, setReactions] = useState<ReactionEvent[]>([]);

  // Sambungan & Sinkronisasi
  const [isConnected, setIsConnected] = useState<boolean>(socket.connected);
  const [syncStats, setSyncStats] = useState<SyncStats>({
    offset: 0,
    latency: 18,
    drift: 0,
    lastSyncTime: Date.now(),
    status: 'synced',
  });

  // Modal State
  const [isDocsOpen, setIsDocsOpen] = useState<boolean>(false);
  const [isDonationOpen, setIsDonationOpen] = useState<boolean>(false);
  const [isAutoplayBlocked, setIsAutoplayBlocked] = useState<boolean>(false);

  // Audio & ClockSync references
  const audioRef = useRef<SyncedAudio | null>(null);
  const clockSyncRef = useRef<ClockSync | null>(null);

  // Rujukan keadaan terkini untuk pendengar soket tanpa kitaran bina semula
  const usernameRef = useRef(username);
  const avatarRef = useRef(avatar);
  const currentTrackRef = useRef(currentTrack);
  const isHostRef = useRef(isHost);
  const queueRef = useRef(queue);
  const handleSkipNextRef = useRef<() => void>(() => {});

  useEffect(() => {
    usernameRef.current = username;
  }, [username]);

  useEffect(() => {
    avatarRef.current = avatar;
  }, [avatar]);

  useEffect(() => {
    currentTrackRef.current = currentTrack;
  }, [currentTrack]);

  useEffect(() => {
    isHostRef.current = isHost;
  }, [isHost]);

  useEffect(() => {
    queueRef.current = queue;
  }, [queue]);

  // Inisialisasi awal Audio & ClockSync
  useEffect(() => {
    const audio = new SyncedAudio(CURATED_TRACKS[0].audio);
    audio.setVolume(0.85);
    audioRef.current = audio;

    const clockSync = new ClockSync(socket);
    clockSyncRef.current = clockSync;

    // Periksa URL sekiranya ada parameter ?room=xyz atau path /room/xyz
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get('room');
    if (roomParam) {
      setRoomId(roomParam);
      if (!localStorage.getItem('poysic_username')) {
        setIsUsernameModalOpen(true);
      }
    } else {
      const match = window.location.pathname.match(/\/room\/([a-zA-Z0-9_-]+)/);
      if (match && match[1]) {
        setRoomId(match[1]);
        if (!localStorage.getItem('poysic_username')) {
          setIsUsernameModalOpen(true);
        }
      }
    }

    // Sambungkan status audio ke UI
    const unregisterState = audio.onStateChange((state) => {
      setCurrentTime(state.currentTime);
      if (state.duration > 0) {
        setDuration(state.duration);
      }
      setIsPlaying(state.isPlaying);
    });

    // Listener sekatan autoplay pelayar
    const unregisterAutoplay = audio.onAutoplayBlocked((blocked) => {
      setIsAutoplayBlocked(blocked);
    });

    // Auto-advance trek seterusnya jika lagu tamat & pengguna adalah hos bilik
    const unregisterEnded = audio.onEnded(() => {
      if (isHostRef.current) {
        handleSkipNextRef.current();
      }
    });

    // Listener sync telemetry
    const unregisterSync = clockSync.onSync(({ offset, latency }) => {
      setSyncStats((prev) => ({
        ...prev,
        offset,
        latency,
        lastSyncTime: Date.now(),
        status: 'synced',
      }));
    });

    // Navigasi sejarah pelayar (Back / Forward button)
    const handlePopState = () => {
      const currentParams = new URLSearchParams(window.location.search);
      const roomParam = currentParams.get('room');
      if (roomParam) {
        setRoomId(roomParam);
      } else {
        const match = window.location.pathname.match(/\/room\/([a-zA-Z0-9_-]+)/);
        if (match && match[1]) {
          setRoomId(match[1]);
        } else {
          setRoomId(null);
          audio.pause();
          setIsPlaying(false);
        }
      }
    };
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      unregisterState();
      unregisterAutoplay();
      unregisterEnded();
      unregisterSync();
      clockSync.stopSync();
      audio.destroy();
    };
  }, []);

  // Pra-muat (preload) trek seterusnya dalam senarai giliran untuk mengelakkan jeda
  useEffect(() => {
    if (queue.length > 0 && queue[0]?.audio) {
      const preload = new Audio();
      preload.preload = 'auto';
      preload.src = queue[0].audio;
    }
  }, [queue]);

  // Pasang listener Socket.IO apabila bilik berubah (kekal stabil & bebas loop)
  useEffect(() => {
    const handleConnect = () => {
      setIsConnected(true);
      if (roomId) {
        socket.emit('room:join', {
          roomId,
          username: usernameRef.current,
          avatar: avatarRef.current,
        });
      }
      clockSyncRef.current?.startSync();
    };

    const handleDisconnect = () => {
      setIsConnected(false);
    };

    const handleSyncState = (state: RoomState & { currentServerTime?: number }) => {
      if (state.currentTrack) {
        setCurrentTrack(state.currentTrack);
        if (audioRef.current) {
          audioRef.current.setSource(state.currentTrack.audio);
        }
      }

      setQueue(state.queue || []);
      setParticipants(state.participants || []);
      setIsHost(state.hostId === socket.id);

      if (state.isPlaying && audioRef.current && clockSyncRef.current) {
        const serverNow = clockSyncRef.current.getServerTime();
        audioRef.current.syncWith(state.position, state.lastUpdated, serverNow);
        audioRef.current.play();
        setIsPlaying(true);
      } else if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.seek(state.position);
        setIsPlaying(false);
      }
    };

    const handleRoomPlay = ({ position, timestamp, track }: { position: number; timestamp: number; track?: Track }) => {
      if (track && currentTrackRef.current?.id !== track.id) {
        setCurrentTrack(track);
        audioRef.current?.setSource(track.audio);
      }
      if (audioRef.current && clockSyncRef.current) {
        const serverNow = clockSyncRef.current.getServerTime();
        const drift = audioRef.current.syncWith(position, timestamp, serverNow);
        setSyncStats((prev) => ({ ...prev, drift }));
        audioRef.current.play();
        setIsPlaying(true);
      }
    };

    const handleRoomPause = ({ position }: { position: number }) => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.seek(position);
        setIsPlaying(false);
      }
    };

    const handleRoomSeek = ({ position, timestamp }: { position: number; timestamp: number }) => {
      if (audioRef.current && clockSyncRef.current) {
        const serverNow = clockSyncRef.current.getServerTime();
        const drift = audioRef.current.syncWith(position, timestamp, serverNow);
        setSyncStats((prev) => ({ ...prev, drift }));
        audioRef.current.seek(position);
      }
    };

    const handleTrackChange = ({ track, position }: { track: Track; position: number }) => {
      setCurrentTrack(track);
      if (audioRef.current) {
        audioRef.current.setSource(track.audio);
        audioRef.current.seek(position || 0);
        audioRef.current.play();
        setIsPlaying(true);
      }
    };

    const handleQueueUpdated = ({ queue: updatedQueue }: { queue: Track[] }) => {
      setQueue(updatedQueue);
    };

    const handleUserJoined = ({ participant, participants: allParticipants }: { participant: Participant; participants: Participant[] }) => {
      setParticipants(allParticipants);
      setChatMessages((prev) => [
        ...prev,
        {
          id: Math.random().toString(36).substring(2, 9),
          senderId: 'system',
          senderName: 'Sistem PoySic',
          senderAvatar: '📢',
          text: `${participant.name} telah menyertai bilik.`,
          timestamp: Date.now(),
          isSystem: true,
        },
      ]);
    };

    const handleUserLeft = ({ userName, participants: allParticipants }: { userName?: string; participants: Participant[] }) => {
      setParticipants(allParticipants);
      const me = allParticipants.find((p) => p.id === socket.id);
      if (me?.isHost) {
        setIsHost(true);
      }
      if (userName) {
        setChatMessages((prev) => [
          ...prev,
          {
            id: Math.random().toString(36).substring(2, 9),
            senderId: 'system',
            senderName: 'Sistem PoySic',
            senderAvatar: '📢',
            text: `${userName} telah meninggalkan bilik.`,
            timestamp: Date.now(),
            isSystem: true,
          },
        ]);
      }
    };

    const handleUserUpdated = ({
      participant,
      participants: allParticipants,
      message,
    }: {
      participant: Participant;
      participants: Participant[];
      oldName?: string;
      message?: string;
    }) => {
      setParticipants(allParticipants);
      if (participant.id === socket.id) {
        setUsername(participant.name);
        if (participant.avatar) setAvatar(participant.avatar);
      }
      if (message) {
        setChatMessages((prev) => [
          ...prev,
          {
            id: Math.random().toString(36).substring(2, 9),
            senderId: 'system',
            senderName: 'Sistem PoySic',
            senderAvatar: '✏️',
            text: message,
            timestamp: Date.now(),
            isSystem: true,
          },
        ]);
      }
    };

    const handleReaction = (reaction: ReactionEvent) => {
      setReactions((prev) => [...prev.slice(-15), reaction]);
      setTimeout(() => {
        setReactions((prev) => prev.filter((r) => r.id !== reaction.id));
      }, 2000);
    };

    const handleChat = (message: ChatMessage) => {
      setChatMessages((prev) => [...prev, message]);
    };

    const handleHeartbeat = ({ isPlaying: serverPlaying, position, timestamp, currentTrack: sTrack }: { isPlaying: boolean; position: number; timestamp: number; currentTrack?: Track }) => {
      if (sTrack && (!currentTrackRef.current || currentTrackRef.current.id !== sTrack.id)) {
        setCurrentTrack(sTrack);
        audioRef.current?.setSource(sTrack.audio);
      }

      if (audioRef.current && clockSyncRef.current) {
        const serverNow = clockSyncRef.current.getServerTime();
        const drift = audioRef.current.syncWith(position, timestamp, serverNow);
        setSyncStats((prev) => ({ ...prev, drift }));

        if (serverPlaying && audioRef.current.isPaused()) {
          audioRef.current.play();
          setIsPlaying(true);
        } else if (!serverPlaying && !audioRef.current.isPaused()) {
          audioRef.current.pause();
          setIsPlaying(false);
        }
      }
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('room:sync_state', handleSyncState);
    socket.on('room:play', handleRoomPlay);
    socket.on('room:pause', handleRoomPause);
    socket.on('room:seek', handleRoomSeek);
    socket.on('room:track_change', handleTrackChange);
    socket.on('room:queue_updated', handleQueueUpdated);
    socket.on('room:user_joined', handleUserJoined);
    socket.on('room:user_left', handleUserLeft);
    socket.on('room:user_updated', handleUserUpdated);
    socket.on('room:reaction', handleReaction);
    socket.on('room:chat', handleChat);
    socket.on('sync:heartbeat', handleHeartbeat);

    if (socket.connected && roomId) {
      socket.emit('room:join', {
        roomId,
        username: usernameRef.current,
        avatar: avatarRef.current,
      });
      clockSyncRef.current?.startSync();
    }

    return () => {
      if (roomId) {
        socket.emit('room:leave', roomId);
      }
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('room:sync_state', handleSyncState);
      socket.off('room:play', handleRoomPlay);
      socket.off('room:pause', handleRoomPause);
      socket.off('room:seek', handleRoomSeek);
      socket.off('room:track_change', handleTrackChange);
      socket.off('room:queue_updated', handleQueueUpdated);
      socket.off('room:user_joined', handleUserJoined);
      socket.off('room:user_left', handleUserLeft);
      socket.off('room:user_updated', handleUserUpdated);
      socket.off('room:reaction', handleReaction);
      socket.off('room:chat', handleChat);
      socket.off('sync:heartbeat', handleHeartbeat);
    };
  }, [roomId]);

  // Pengendali kemaskini profil pengguna
  const handleUpdateProfile = (newUsername: string, newAvatar: string) => {
    const cleanName = newUsername.trim() || username || 'Pendengar PoySic';
    const cleanAvatar = newAvatar || avatar || '🎧';

    setUsername(cleanName);
    setAvatar(cleanAvatar);
    localStorage.setItem('poysic_username', cleanName);
    localStorage.setItem('poysic_avatar', cleanAvatar);

    if (roomId) {
      socket.emit('user:update_profile', {
        roomId,
        username: cleanName,
        avatar: cleanAvatar,
      });
    }
    setIsUsernameModalOpen(false);
  };

  // Pengendali tindakan pengguna
  const handleJoinRoom = (newRoomId: string, customName: string, customAvatar: string) => {
    const finalName = customName.trim() || username || 'Pendengar PoySic';
    const finalAvatar = customAvatar || avatar || '🎧';

    setUsername(finalName);
    setAvatar(finalAvatar);
    localStorage.setItem('poysic_username', finalName);
    localStorage.setItem('poysic_avatar', finalAvatar);
    setRoomId(newRoomId);
    setChatMessages([]);

    const newUrl = `${window.location.origin}?room=${newRoomId}`;
    window.history.pushState({ room: newRoomId }, '', newUrl);

    socket.emit('room:join', { roomId: newRoomId, username: finalName, avatar: finalAvatar });
    clockSyncRef.current?.startSync();
  };

  const handleLeaveRoom = () => {
    if (roomId) {
      socket.emit('room:leave', roomId);
    }
    setRoomId(null);
    window.history.pushState({}, '', window.location.origin);
    audioRef.current?.pause();
    setIsPlaying(false);
  };

  const handlePlay = () => {
    if (!audioRef.current) return;
    const pos = audioRef.current.getCurrentTime();
    audioRef.current.play();
    setIsPlaying(true);
    if (roomId) {
      socket.emit('host:play', { roomId, position: pos });
    }
  };

  const handlePause = () => {
    if (!audioRef.current) return;
    const pos = audioRef.current.getCurrentTime();
    audioRef.current.pause();
    setIsPlaying(false);
    if (roomId) {
      socket.emit('host:pause', { roomId, position: pos });
    }
  };

  const handleSeek = (position: number) => {
    if (!audioRef.current) return;
    audioRef.current.seek(position);
    setCurrentTime(position);
    if (roomId) {
      socket.emit('host:seek', { roomId, position });
    }
  };

  const handleResumeAudio = () => {
    if (audioRef.current) {
      audioRef.current.ensureAudioContext();
      audioRef.current.play();
      setIsAutoplayBlocked(false);
    }
  };

  const handleSelectTrack = (track: Track) => {
    if (!isHostRef.current && roomId) {
      handleAddToQueue(track);
      setChatMessages((prev) => [
        ...prev,
        {
          id: Math.random().toString(36).substring(2, 9),
          senderId: 'system',
          senderName: 'Sistem PoySic',
          senderAvatar: '🎵',
          text: `Anda telah mencadangkan "${track.name}" ke giliran lagu bilik.`,
          timestamp: Date.now(),
          isSystem: true,
        },
      ]);
      return;
    }

    setCurrentTrack(track);
    if (audioRef.current) {
      audioRef.current.setSource(track.audio);
      audioRef.current.seek(0);
      audioRef.current.play();
      setIsPlaying(true);
    }
    if (roomId) {
      socket.emit('host:track_change', { roomId, track });
    }
  };

  const handleSkipNext = useCallback(() => {
    if (queue.length > 0) {
      const nextTrack = queue[0];
      handleRemoveFromQueue(nextTrack.id);
      handleSelectTrack(nextTrack);
    } else {
      // Mainkan semula atau pilih lagu seterusnya daripada senarai curated
      const currentIndex = CURATED_TRACKS.findIndex((t) => t.id === currentTrack?.id);
      const nextIndex = (currentIndex + 1) % CURATED_TRACKS.length;
      handleSelectTrack(CURATED_TRACKS[nextIndex]);
    }
  }, [queue, currentTrack]);

  useEffect(() => {
    handleSkipNextRef.current = handleSkipNext;
  }, [handleSkipNext]);

  const handleSkipPrev = () => {
    if (audioRef.current) {
      if (audioRef.current.getCurrentTime() > 5) {
        handleSeek(0);
      } else {
        const currentIndex = CURATED_TRACKS.findIndex((t) => t.id === currentTrack?.id);
        const prevIndex = (currentIndex - 1 + CURATED_TRACKS.length) % CURATED_TRACKS.length;
        handleSelectTrack(CURATED_TRACKS[prevIndex]);
      }
    }
  };

  const handleSetVolume = (vol: number) => {
    setVolume(vol);
    setIsMuted(vol === 0);
    audioRef.current?.setVolume(vol);
  };

  const handleToggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    audioRef.current?.setMuted(nextMuted);
  };

  const handleAddToQueue = (track: Track) => {
    setQueue((prev) => {
      if (prev.some((t) => t.id === track.id)) return prev;
      const updated = [...prev, track];
      if (roomId) {
        socket.emit('host:queue_add', { roomId, track });
      }
      return updated;
    });
  };

  const handleRemoveFromQueue = (trackId: string) => {
    setQueue((prev) => {
      const updated = prev.filter((t) => t.id !== trackId);
      if (roomId) {
        socket.emit('host:queue_remove', { roomId, trackId });
      }
      return updated;
    });
  };

  const handleClearQueue = () => {
    setQueue([]);
    if (roomId) {
      socket.emit('host:queue_clear', { roomId });
    }
  };

  const handleForceSync = () => {
    clockSyncRef.current?.forceSync();
    if (audioRef.current && currentTrack) {
      socket.emit('clock:ping', Date.now(), () => {
        // Ping refresh
      });
    }
  };

  const handleSendMessage = (text: string) => {
    if (roomId) {
      socket.emit('room:chat', {
        roomId,
        text,
        senderName: username,
        senderAvatar: avatar,
      });
    }
  };

  const handleSendReaction = (emoji: string) => {
    if (roomId) {
      socket.emit('room:reaction', {
        roomId,
        emoji,
        senderName: username,
      });
    }
  };

  const handleSearchJamendo = useCallback(async (query: string): Promise<Track[]> => {
    try {
      const apiBase = import.meta.env.VITE_SOCKET_URL || '';
      const res = await fetch(`${apiBase}/api/tracks/search?q=${encodeURIComponent(query)}`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.results) {
          return data.results;
        }
      }
    } catch (err) {
      console.warn('[PoySic] Carian API gagal, cuba melalui soket:', err);
    }

    return new Promise((resolve) => {
      socket.emit('tracks:search', query, (results: Track[]) => {
        resolve(results && results.length > 0 ? results : CURATED_TRACKS);
      });
    });
  }, []);

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#F5F3EE] flex flex-col font-sans selection:bg-[#FF4D2E] selection:text-[#0A0A0A]">
      {/* Bar Navigasi */}
      <Navbar
        currentRoomId={roomId}
        participants={participants}
        syncStats={syncStats}
        isConnected={isConnected}
        username={username}
        avatar={avatar}
        onChangeUsername={() => setIsUsernameModalOpen(true)}
        onLeaveRoom={handleLeaveRoom}
        onForceSync={handleForceSync}
        onOpenDocs={() => setIsDocsOpen(true)}
        onOpenDonation={() => setIsDonationOpen(true)}
      />

      {/* Kandungan Halaman: Landing View atau Player View */}
      <main className="flex-1 flex flex-col">
        {!roomId ? (
          <LandingView
            onJoinRoom={handleJoinRoom}
            onOpenDocs={() => setIsDocsOpen(true)}
            onOpenDonation={() => setIsDonationOpen(true)}
          />
        ) : (
          <PlayerView
            roomId={roomId}
            isHost={isHost}
            username={username}
            avatar={avatar}
            currentTrack={currentTrack}
            isPlaying={isPlaying}
            currentTime={currentTime}
            duration={duration}
            queue={queue}
            participants={participants}
            syncStats={syncStats}
            volume={volume}
            isMuted={isMuted}
            chatMessages={chatMessages}
            reactions={reactions}
            currentUserId={socket.id || 'me'}
            syncedAudio={audioRef.current}
            isAutoplayBlocked={isAutoplayBlocked}
            onResumeAudio={handleResumeAudio}
            onPlay={handlePlay}
            onPause={handlePause}
            onSeek={handleSeek}
            onSkipNext={handleSkipNext}
            onSkipPrev={handleSkipPrev}
            onSetVolume={handleSetVolume}
            onToggleMute={handleToggleMute}
            onSelectTrack={handleSelectTrack}
            onAddToQueue={handleAddToQueue}
            onRemoveFromQueue={handleRemoveFromQueue}
            onClearQueue={handleClearQueue}
            onSearchJamendo={handleSearchJamendo}
            onForceSync={handleForceSync}
            onSendMessage={handleSendMessage}
            onSendReaction={handleSendReaction}
            onChangeUsername={() => setIsUsernameModalOpen(true)}
          />
        )}
      </main>

      {/* Footer Ringkas */}
      <footer className="border-t border-[#1C1C1C] py-5 px-4 text-xs font-mono text-[#8E8E8A] bg-[#0A0A0A]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            <span>POYSIC MVP &bull; SINKRONISASI MASA NYATA &bull; JAMENDO CC</span>
          </div>
          <div className="flex items-center gap-4 text-[#A0A09C]">
            <button onClick={() => setIsDocsOpen(true)} className="hover:text-[#F5F3EE] transition">
              DOKUMENTASI
            </button>
            <span>&bull;</span>
            <button onClick={() => setIsDonationOpen(true)} className="hover:text-[#FF4D2E] transition">
              SAWERIA
            </button>
            <span>&bull;</span>
            <span className="text-[#A8E6CF]">SIFAR IKLAN</span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <DocsModal isOpen={isDocsOpen} onClose={() => setIsDocsOpen(false)} />
      <DonationModal isOpen={isDonationOpen} onClose={() => setIsDonationOpen(false)} />
      <UsernameModal
        isOpen={isUsernameModalOpen}
        currentUsername={username}
        currentAvatar={avatar}
        onSave={handleUpdateProfile}
        onClose={() => setIsUsernameModalOpen(false)}
      />
    </div>
  );
}
