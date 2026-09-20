/**
 * client/src/hooks/useRoom.ts
 * Tujuan: Hook tersuai untuk menguruskan komunikasi bilik Socket.IO, kehadiran peserta, dan sembang/reaksi bilik.
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Socket } from 'socket.io-client';
import { Track, Participant, RoomState, ChatMessage, ReactionEvent } from '../types';

interface UseRoomOptions {
  socket: Socket;
  onSyncState?: (state: RoomState & { currentServerTime?: number }) => void;
  onRoomPlay?: (data: { position: number; timestamp: number; track?: Track }) => void;
  onRoomPause?: (data: { position: number }) => void;
  onRoomSeek?: (data: { position: number; timestamp: number }) => void;
  onTrackChange?: (data: { track: Track; position: number }) => void;
  onQueueUpdated?: (data: { queue: Track[] }) => void;
  onHeartbeat?: (data: { isPlaying: boolean; position: number; timestamp: number; currentTrack?: Track }) => void;
  onStartSync?: () => void;
}

export function useRoom(options: UseRoomOptions) {
  const { t } = useTranslation();
  const {
    socket,
    onSyncState,
    onRoomPlay,
    onRoomPause,
    onRoomSeek,
    onTrackChange,
    onQueueUpdated,
    onHeartbeat,
    onStartSync,
  } = options;

  const [roomId, setRoomId] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(socket.connected);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [isHost, setIsHost] = useState<boolean>(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [reactions, setReactions] = useState<ReactionEvent[]>([]);

  // Refs untuk callbacks supaya tidak mencetuskan re-bind event listener Socket.IO
  const callbacksRef = useRef({
    onSyncState,
    onRoomPlay,
    onRoomPause,
    onRoomSeek,
    onTrackChange,
    onQueueUpdated,
    onHeartbeat,
    onStartSync,
  });

  useEffect(() => {
    callbacksRef.current = {
      onSyncState,
      onRoomPlay,
      onRoomPause,
      onRoomSeek,
      onTrackChange,
      onQueueUpdated,
      onHeartbeat,
      onStartSync,
    };
  });

  const usernameRef = useRef<string>('Pendengar PoySic');
  const avatarRef = useRef<string>('🎧');

  const setLocalProfile = useCallback((name: string, av: string) => {
    usernameRef.current = name;
    avatarRef.current = av;
  }, []);

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
      callbacksRef.current.onStartSync?.();
    };

    const handleDisconnect = () => {
      setIsConnected(false);
    };

    const handleSyncState = (state: RoomState & { currentServerTime?: number }) => {
      setParticipants(state.participants || []);
      setIsHost(state.hostId === socket.id);
      callbacksRef.current.onSyncState?.(state);
    };

    const handleRoomPlay = (data: { position: number; timestamp: number; track?: Track }) => {
      callbacksRef.current.onRoomPlay?.(data);
    };

    const handleRoomPause = (data: { position: number }) => {
      callbacksRef.current.onRoomPause?.(data);
    };

    const handleRoomSeek = (data: { position: number; timestamp: number }) => {
      callbacksRef.current.onRoomSeek?.(data);
    };

    const handleTrackChange = (data: { track: Track; position: number }) => {
      callbacksRef.current.onTrackChange?.(data);
    };

    const handleQueueUpdated = (data: { queue: Track[] }) => {
      callbacksRef.current.onQueueUpdated?.(data);
    };

    const handleUserJoined = ({ participant, participants: allParticipants }: { participant: Participant; participants: Participant[] }) => {
      setParticipants(allParticipants);
      setChatMessages((prev) => [
        ...prev,
        {
          id: Math.random().toString(36).substring(2, 9),
          senderId: 'system',
          senderName: t('chat.systemSender'),
          senderAvatar: '📢',
          text: t('chat.userJoined', { name: participant.name }),
          timestamp: Date.now(),
          isSystem: true,
        },
      ]);
    };

    const handleUserLeft = ({ userName, participants: allParticipants }: { userName?: string; participants: Participant[] }) => {
      setParticipants(allParticipants);
      if (userName) {
        setChatMessages((prev) => [
          ...prev,
          {
            id: Math.random().toString(36).substring(2, 9),
            senderId: 'system',
            senderName: t('chat.systemSender'),
            senderAvatar: '📢',
            text: t('chat.userLeft', { name: userName }),
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

    const handleHeartbeat = (data: { isPlaying: boolean; position: number; timestamp: number; currentTrack?: Track }) => {
      callbacksRef.current.onHeartbeat?.(data);
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
      callbacksRef.current.onStartSync?.();
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
  }, [socket, roomId]);

  const joinRoom = useCallback((newRoomId: string, customName: string, customAvatar: string) => {
    usernameRef.current = customName;
    avatarRef.current = customAvatar;
    setRoomId(newRoomId);
    setChatMessages([]);

    const newUrl = `${window.location.origin}?room=${newRoomId}`;
    window.history.pushState({ room: newRoomId }, '', newUrl);

    socket.emit('room:join', { roomId: newRoomId, username: customName, avatar: customAvatar });
    callbacksRef.current.onStartSync?.();
  }, [socket]);

  const leaveRoom = useCallback(() => {
    if (roomId) {
      socket.emit('room:leave', roomId);
    }
    setRoomId(null);
    setParticipants([]);
    setIsHost(false);
    setChatMessages([]);
    window.history.pushState({}, '', window.location.origin);
  }, [socket, roomId]);

  const sendPlay = useCallback((position: number) => {
    if (roomId) {
      socket.emit('host:play', { roomId, position });
    }
  }, [socket, roomId]);

  const sendPause = useCallback((position: number) => {
    if (roomId) {
      socket.emit('host:pause', { roomId, position });
    }
  }, [socket, roomId]);

  const sendSeek = useCallback((position: number) => {
    if (roomId) {
      socket.emit('host:seek', { roomId, position });
    }
  }, [socket, roomId]);

  const sendTrackChange = useCallback((track: Track) => {
    if (roomId) {
      socket.emit('host:track_change', { roomId, track });
    }
  }, [socket, roomId]);

  const sendQueueAdd = useCallback((track: Track) => {
    if (roomId) {
      socket.emit('host:queue_add', { roomId, track });
    }
  }, [socket, roomId]);

  const sendQueueRemove = useCallback((trackId: string) => {
    if (roomId) {
      socket.emit('host:queue_remove', { roomId, trackId });
    }
  }, [socket, roomId]);

  const sendQueueClear = useCallback(() => {
    if (roomId) {
      socket.emit('host:queue_clear', { roomId });
    }
  }, [socket, roomId]);

  const sendChat = useCallback((text: string, senderName: string, senderAvatar: string) => {
    if (roomId) {
      socket.emit('room:chat', {
        roomId,
        text,
        senderName,
        senderAvatar,
      });
    }
  }, [socket, roomId]);

  const sendReaction = useCallback((emoji: string, senderName: string) => {
    if (roomId) {
      socket.emit('room:reaction', {
        roomId,
        emoji,
        senderName,
      });
    }
  }, [socket, roomId]);

  const sendUpdateProfile = useCallback((newUsername: string, newAvatar: string) => {
    usernameRef.current = newUsername;
    avatarRef.current = newAvatar;
    if (roomId) {
      socket.emit('user:update_profile', {
        roomId,
        username: newUsername,
        avatar: newAvatar,
      });
    }
  }, [socket, roomId]);

  return {
    roomId,
    setRoomId,
    isConnected,
    participants,
    isHost,
    setIsHost,
    chatMessages,
    setChatMessages,
    reactions,
    setLocalProfile,
    joinRoom,
    leaveRoom,
    sendPlay,
    sendPause,
    sendSeek,
    sendTrackChange,
    sendQueueAdd,
    sendQueueRemove,
    sendQueueClear,
    sendChat,
    sendReaction,
    sendUpdateProfile,
  };
}
