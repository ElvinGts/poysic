/**
 * client/src/components/ui/PlayerView.tsx
 * Tujuan: Paparan pemain tersinkron penuh dengan visualizer kanvas audio masa nyata,
 * animasi piring hitam (vinyl), kawalan audio analog-digital, dan panel modular (Cari, Queue, Chat, Peserta, Telemetri).
 */
import React, { useState, useEffect } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  RefreshCw,
  Share2,
  Music,
  Users,
  Search,
  ListMusic,
  MessageSquare,
  Activity,
  Check,
  Disc3,
  User,
} from 'lucide-react';
import { Track, Participant, SyncStats, ChatMessage, ReactionEvent } from '../../types';
import { SyncedAudio } from '../../lib/audio';
import { AudioVisualizer } from '../player/AudioVisualizer';
import { TrackSearch } from './TrackSearch';
import { QueueList } from '../queue/QueueList';
import { RoomChat } from '../room/RoomChat';
import { UserList } from '../room/UserList';
import { useTranslation } from 'react-i18next';

interface PlayerViewProps {
  roomId: string;
  isHost: boolean;
  username: string;
  avatar: string;
  currentTrack: Track | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  queue: Track[];
  participants: Participant[];
  syncStats: SyncStats;
  volume: number;
  isMuted: boolean;
  chatMessages: ChatMessage[];
  reactions: ReactionEvent[];
  currentUserId: string;
  syncedAudio?: SyncedAudio | null;
  isAutoplayBlocked?: boolean;
  isBuffering?: boolean;
  audioError?: string | null;
  onResumeAudio?: () => void;
  onRetryAudio?: () => void;
  onPlay: () => void;
  onPause: () => void;
  onSeek: (position: number) => void;
  onSkipNext: () => void;
  onSkipPrev: () => void;
  onSetVolume: (vol: number) => void;
  onToggleMute: () => void;
  onSelectTrack: (track: Track) => void;
  onAddToQueue: (track: Track) => void;
  onRemoveFromQueue: (trackId: string) => void;
  onClearQueue: () => void;
  onSearchJamendo: (q: string, source?: 'all' | 'jamendo' | 'audius') => Promise<Track[]>;
  onForceSync: () => void;
  onSendMessage: (text: string) => void;
  onSendReaction: (emoji: string) => void;
  onChangeUsername: () => void;
}

export const PlayerView: React.FC<PlayerViewProps> = ({
  roomId,
  isHost,
  username,
  avatar,
  currentTrack,
  isPlaying,
  currentTime,
  duration,
  queue,
  participants,
  syncStats,
  volume,
  isMuted,
  chatMessages,
  reactions,
  currentUserId,
  syncedAudio,
  isAutoplayBlocked,
  isBuffering,
  audioError,
  onResumeAudio,
  onRetryAudio,
  onPlay,
  onPause,
  onSeek,
  onSkipNext,
  onSkipPrev,
  onSetVolume,
  onToggleMute,
  onSelectTrack,
  onAddToQueue,
  onRemoveFromQueue,
  onClearQueue,
  onSearchJamendo,
  onForceSync,
  onSendMessage,
  onSendReaction,
  onChangeUsername,
}) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'search' | 'queue' | 'chat' | 'participants' | 'telemetry'>('search');
  const [copiedLink, setCopiedLink] = useState(false);
  const [unreadChatCount, setUnreadChatCount] = useState(0);

  // Pantau mesej baru jika pengguna tidak berada di tab 'chat'
  useEffect(() => {
    if (activeTab === 'chat') {
      setUnreadChatCount(0);
    } else if (chatMessages.length > 0) {
      const lastMsg = chatMessages[chatMessages.length - 1];
      if (lastMsg && !lastMsg.isSystem && lastMsg.senderId !== currentUserId) {
        setUnreadChatCount((prev) => prev + 1);
      }
    }
  }, [chatMessages, activeTab, currentUserId]);

  const handleCopy = () => {
    const url = `${window.location.origin}?room=${roomId}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    });
  };

  const formatTime = (secs: number) => {
    if (!secs || isNaN(secs)) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const progressPercent = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col gap-6 text-[#F5F3EE]">
      {/* Bar Atas Bilik & Status Hos */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#111111] border border-[#242424] p-3 sm:p-4 rounded-none">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#1A1A1A] text-[#FF4D2E] border border-[#333333]">
            <Disc3 className={`w-5 h-5 ${isPlaying ? 'animate-spin' : ''}`} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#888884] font-mono">{t('player.room')}</span>
              <span className="font-bold text-[#F5F3EE] text-sm sm:text-base font-mono tracking-wider">
                {roomId}
              </span>
              <span className={`text-[10px] uppercase font-mono font-bold px-2 py-0.5 border ${
                isHost
                  ? 'bg-[#2A1713] text-[#FF4D2E] border-[#5E271D]'
                  : 'bg-[#181818] text-[#999994] border-[#303030]'
              }`}>
                {isHost ? t('player.host') : t('player.listener')}
              </span>
            </div>
            <p className="text-[11px] text-[#8E8E8A] hidden sm:block font-mono mt-0.5">
              {isHost
                ? t('player.hostDesc')
                : t('player.listenerDesc')}
            </p>
          </div>
        </div>

          {/* Senarai Rakan & Butang Kongsi */}
        <div className="flex items-center gap-2">
          {/* Avatar Peserta & Butang Akses Tab Peserta */}
          <button
            type="button"
            onClick={() => setActiveTab('participants')}
            title={t('player.listenersCount')}
            aria-label={t('player.listenersCount')}
            className="min-h-[44px] flex items-center gap-2 px-3 py-2 bg-[#171717] hover:bg-[#202020] border border-[#2E2E2E] transition group"
          >
            <div className="flex items-center -space-x-1.5 overflow-hidden">
              {participants.slice(0, 4).map((p) => (
                <div
                  key={p.id}
                  title={`${p.name} ${p.isHost ? `(${t('player.host')})` : ''}`}
                  className="w-5 h-5 bg-[#0A0A0A] border border-[#3A3A3A] flex items-center justify-center text-[9px] font-mono font-bold text-[#FF4D2E]"
                >
                  {p.avatar || 'LP'}
                </div>
              ))}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-[#F5F3EE] font-mono">
              <Users className="w-3.5 h-3.5 text-[#A8E6CF]" />
              <span>{participants.length}</span>
              <span className="hidden sm:inline text-[10px] text-[#A0A09C]">{t('player.listenersCount')}</span>
            </div>
          </button>

          <button
            onClick={handleCopy}
            title={t('player.shareRoom')}
            aria-label={t('player.shareRoom')}
            className="min-h-[44px] flex items-center gap-1.5 px-3 py-2 bg-[#171717] hover:bg-[#222222] text-[#A8E6CF] border border-[#2E2E2E] text-xs font-mono transition"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-[#A8E6CF]" /> : <Share2 className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{copiedLink ? t('player.copied') : t('player.shareRoom')}</span>
          </button>
        </div>
      </div>

      {/* Grid Utama: Player Kiri & Tab Interaktif Kanan */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Kolum Kiri: Pemain Audio & Piring Vinyl (5 Kolum) */}
        <div className="lg:col-span-5 bg-[#111111] border border-[#242424] p-5 sm:p-6 flex flex-col items-center justify-between text-center relative min-h-[580px]">
          {/* Reaksi Terapung */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
            {reactions.map((r) => (
              <div
                key={r.id}
                className="absolute bottom-16 left-1/2 -translate-x-1/2 text-2xl animate-floatUp"
              >
                {r.emoji}
              </div>
            ))}
          </div>

          {/* Lencana Status Drift & Jam */}
          <div className="w-full flex items-center justify-between text-[11px] font-mono text-[#A0A09C] mb-3 z-10">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 ${
                syncStats.drift > 0.45 ? 'bg-[#FF4D2E] animate-pulse' : 'bg-[#A8E6CF]'
              }`} />
              <span>
                {t('player.drift', { drift: (syncStats.drift * 1000).toFixed(0) })}
              </span>
            </div>

            <button
              onClick={onForceSync}
              title={t('player.resync')}
              aria-label={t('player.resync')}
              className="min-h-[44px] px-2 hover:text-[#A8E6CF] flex items-center gap-1.5 transition text-[10px] uppercase font-mono"
            >
              <RefreshCw className="w-3 h-3" />
              <span>{t('player.resync')}</span>
            </button>
          </div>

          {/* Penunjuk Menimbal Audio (Buffering Indicator) */}
          {isBuffering && (
            <div className="w-full mb-3 px-3 py-2.5 bg-[#141414] border border-[#A8E6CF]/60 flex items-center justify-center gap-2.5 text-xs font-mono text-[#A8E6CF] animate-pulse">
              <RefreshCw className="w-4 h-4 animate-spin text-[#A8E6CF]" />
              <span className="font-bold tracking-wider">{t('player.buffering')}</span>
            </div>
          )}

          {/* Makluman Ralat Audio (Audio Error Handler) */}
          {audioError && (
            <div className="w-full mb-3 px-3 py-2.5 bg-[#2A1412] border border-[#FF4D2E] flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-[#FF9B85] text-xs font-mono text-left">
                <VolumeX className="w-4 h-4 text-[#FF4D2E] shrink-0" />
                <span>{audioError || t('player.audioErrorDefault')}</span>
              </div>
              {onRetryAudio && (
                <button
                  onClick={onRetryAudio}
                  aria-label={t('player.retry')}
                  className="min-h-[44px] px-3 py-1.5 bg-[#FF4D2E] hover:bg-[#ff6145] text-[#0A0A0A] font-mono text-[10px] uppercase font-bold tracking-wider transition shrink-0 flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>{t('player.retry')}</span>
                </button>
              )}
            </div>
          )}

          {/* Makluman Sekatan Autoplay Pelayar */}
          {isAutoplayBlocked && (
            <div className="w-full mb-3 px-3 py-2.5 bg-[#1C120C] border border-[#FF4D2E] flex items-center justify-between gap-3 animate-pulse">
              <div className="flex items-center gap-2 text-[#FF9B85] text-xs font-mono">
                <VolumeX className="w-4 h-4 text-[#FF4D2E] shrink-0" />
                <span>{t('player.autoplayBlocked')}</span>
              </div>
              <button
                onClick={onResumeAudio}
                aria-label={t('player.enableAudio')}
                className="min-h-[44px] px-3 py-1.5 bg-[#FF4D2E] hover:bg-[#ff6145] text-[#0A0A0A] font-mono text-[10px] uppercase font-bold tracking-wider transition shrink-0 flex items-center justify-center"
              >
                {t('player.enableAudio')}
              </button>
            </div>
          )}

          {/* Animasi Piring Hitam (Vinyl Record Player) */}
          <div className="relative my-2 flex items-center justify-center">
            {/* Bayang & Cincin Luar Vinyl */}
            <div className={`w-48 h-48 sm:w-56 sm:h-56 rounded-full bg-[#050505] border-4 border-[#1E1E1E] shadow-2xl flex items-center justify-center relative p-1 transition-transform duration-700 ${
              isPlaying ? 'rotate-animation' : ''
            }`}>
              {/* Alur Garis Piring Hitam (Grooves) */}
              <div className="w-full h-full rounded-full border border-[#181818] p-3 flex items-center justify-center">
                <div className="w-full h-full rounded-full border border-[#141414] p-3 flex items-center justify-center">
                  <div className="w-full h-full rounded-full border border-[#181818] p-3 flex items-center justify-center">
                    {/* Gambar Album di Tengah */}
                    <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden border-2 border-[#1F1F1F] relative shadow-inner bg-[#121212] flex items-center justify-center">
                      {currentTrack?.image ? (
                        <img
                          src={currentTrack.image}
                          alt={`${currentTrack.name} cover`}
                          width={96}
                          height={96}
                          loading="lazy"
                          decoding="async"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Music className="w-7 h-7 text-[#767672] animate-pulse" />
                      )}
                      {/* Lubang Spindle Tengah */}
                      <div className="absolute w-3 h-3 bg-[#0A0A0A] rounded-full border border-[#333333]" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Jarum Vinyl Stylus (Tonearm) */}
            <div
              className={`absolute -top-2 right-2 w-12 h-20 tonearm-spring pointer-events-none hidden sm:block ${
                isPlaying ? 'rotate-12' : '-rotate-12 opacity-40'
              }`}
            >
              <div className="w-1.5 h-16 bg-[#666666] rounded-none ml-auto mr-2" />
              <div className="w-3 h-4 bg-[#FF4D2E] rounded-none ml-auto mr-1 -mt-1" />
            </div>
          </div>

          {/* Visualizer Frekuensi Muzik Sebenar (Canvas Audio Visualizer) */}
          <div className="w-full my-3">
            <AudioVisualizer
              syncedAudio={syncedAudio ?? null}
              isPlaying={isPlaying}
              currentTime={currentTime}
              duration={duration}
              volume={volume}
              isMuted={isMuted}
              trackGenre={currentTrack?.genre}
              className="h-20 sm:h-24"
            />
          </div>

          {/* Maklumat Trek Semasa */}
          <div className="w-full max-w-sm px-2 mb-3 text-left">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-xl sm:text-2xl font-normal text-[#F5F3EE] truncate font-editorial">
                {currentTrack?.name || t('player.noTrack')}
              </h3>
              {currentTrack?.genre && (
                <span className="text-[10px] font-mono px-2 py-0.5 bg-[#171717] text-[#A8E6CF] border border-[#282828] shrink-0">
                  {currentTrack.genre.toUpperCase()}
                </span>
              )}
            </div>
            <p className="text-xs text-[#A0A09C] truncate font-mono mt-0.5">
              {currentTrack?.artist_name || t('player.selectTrackHint')}
            </p>
          </div>

          {/* Bar Garis Kemajuan Lagu (Seek Scrubber) */}
          <div className="w-full max-w-sm px-2 flex flex-col gap-1 mb-3">
            <div
              role="slider"
              aria-label="Track progress"
              aria-valuenow={Math.round(currentTime)}
              aria-valuemin={0}
              aria-valuemax={Math.round(duration)}
              aria-valuetext={`${formatTime(currentTime)} / ${formatTime(duration)}`}
              tabIndex={isHost ? 0 : -1}
              onKeyDown={(e) => {
                if (!isHost) return;
                if (e.key === 'ArrowRight') {
                  e.preventDefault();
                  onSeek(Math.min(duration, currentTime + 5));
                } else if (e.key === 'ArrowLeft') {
                  e.preventDefault();
                  onSeek(Math.max(0, currentTime - 5));
                } else if (e.key === 'Home') {
                  e.preventDefault();
                  onSeek(0);
                } else if (e.key === 'End') {
                  e.preventDefault();
                  onSeek(duration);
                }
              }}
              className="w-full py-4 -my-3 cursor-pointer relative group flex items-center focus:outline-none"
              onClick={(e) => {
                if (!isHost) return;
                const rect = e.currentTarget.getBoundingClientRect();
                const pos = ((e.clientX - rect.left) / rect.width) * duration;
                onSeek(Math.max(0, Math.min(duration, pos)));
              }}
            >
              <div className="w-full h-2 bg-[#1A1A1A] border border-[#2A2A2A] relative group-focus:border-[#FF4D2E]">
                <div
                  style={{ width: `${progressPercent}%` }}
                  className="h-full bg-[#FF4D2E] relative transition-all duration-100"
                />
              </div>
            </div>

            <div className="flex justify-between text-[10px] font-mono text-[#8E8E8A]">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Butang Kawalan Pemain Muzik */}
          <div className="flex items-center justify-center gap-4 mb-3">
            <button
              onClick={onSkipPrev}
              disabled={!isHost}
              title={isHost ? t('player.prevTrack') : t('player.listenerDesc')}
              aria-label={t('player.prevTrack')}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center p-2.5 text-[#A0A09C] hover:text-[#F5F3EE] hover:bg-[#1C1C1C] disabled:opacity-30 border border-transparent hover:border-[#2C2C2C] transition"
            >
              <SkipBack className="w-5 h-5" />
            </button>

            <button
              onClick={() => {
                if (isPlaying) {
                  onPause();
                } else {
                  onPlay();
                }
              }}
              disabled={!isHost}
              title={
                !isHost
                  ? t('player.listenerDesc')
                  : isPlaying
                  ? t('player.pause')
                  : t('player.play')
              }
              aria-label={isPlaying ? t('player.pause') : t('player.play')}
              className="min-h-[52px] min-w-[52px] flex items-center justify-center p-4 bg-[#FF4D2E] hover:bg-[#ff6145] text-[#0A0A0A] disabled:opacity-30 disabled:cursor-not-allowed transition transform active:scale-95"
            >
              {isPlaying ? (
                <Pause className="w-6 h-6 fill-[#0A0A0A]" />
              ) : (
                <Play className="w-6 h-6 fill-[#0A0A0A] translate-x-0.5" />
              )}
            </button>

            <button
              onClick={onSkipNext}
              disabled={!isHost}
              title={isHost ? t('player.nextTrack') : t('player.listenerDesc')}
              aria-label={t('player.nextTrack')}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center p-2.5 text-[#A0A09C] hover:text-[#F5F3EE] hover:bg-[#1C1C1C] disabled:opacity-30 border border-transparent hover:border-[#2C2C2C] transition"
            >
              <SkipForward className="w-5 h-5" />
            </button>
          </div>

          {/* Kawalan Kelantangan Suara (Volume Slider) */}
          <div className="w-full max-w-xs flex items-center gap-3 px-2 py-2 bg-[#0C0C0C] border border-[#222222] min-h-[44px]">
            <button
              onClick={onToggleMute}
              title={isMuted ? t('player.unmute') : t('player.mute')}
              aria-label={isMuted ? t('player.unmute') : t('player.mute')}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center text-[#A0A09C] hover:text-[#F5F3EE] transition -ml-1"
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="w-4 h-4 text-[#FF4D2E]" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={isMuted ? 0 : volume}
              onChange={(e) => onSetVolume(parseFloat(e.target.value))}
              aria-label={t('player.volume')}
              className="analog-slider flex-1 cursor-pointer"
            />
            <span className="text-[10px] font-mono text-[#8E8E8A] w-9 text-right">
              {isMuted ? '0%' : `${Math.round(volume * 100)}%`}
            </span>
          </div>

          {/* Kad Profil Pengguna pada Kawalan Pemain */}
          <div className="w-full max-w-xs flex items-center justify-between gap-2 p-2.5 mt-2 bg-[#0C0C0C] border border-[#222222] z-10 text-left">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="px-2 py-1 bg-[#1A1A1A] border border-[#333333] font-mono text-xs font-bold text-[#FF4D2E] shrink-0">
                {avatar || 'LP'}
              </span>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-mono font-bold text-[#F5F3EE] truncate max-w-[120px]" title={username}>
                    {username}
                  </span>
                  <span className="text-[9px] font-mono px-1 bg-[#1F1F1F] text-[#A8E6CF] border border-[#333333] shrink-0">
                    {t('player.you')}
                  </span>
                </div>
                <span className="text-[10px] font-mono text-[#8E8E8A] block truncate">
                  {isHost ? t('player.hostControl') : t('player.listenerRole')}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={onChangeUsername}
              title={t('player.change')}
              aria-label={t('player.change')}
              className="min-h-[44px] flex items-center gap-1.5 text-[10px] font-mono text-[#A0A09C] hover:text-[#F5F3EE] bg-[#171717] hover:bg-[#222222] border border-[#2E2E2E] px-3 py-1.5 transition shrink-0"
            >
              <User className="w-3.5 h-3.5" />
              <span>{t('player.change')}</span>
            </button>
          </div>
        </div>

        {/* Kolum Kanan: Tab Interaktif (Carian, Queue, Chat, Peserta, Telemetri) (7 Kolum) */}
        <div className="lg:col-span-7 bg-[#111111] border border-[#242424] p-5 sm:p-6 flex flex-col h-[580px] relative">
          {/* Header Tab Navigasi */}
          <div role="tablist" aria-label="Navigasi panel bilik" className="flex items-center justify-between border-b border-[#222222] pb-3 mb-4 gap-2 overflow-x-auto">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <button
                role="tab"
                aria-selected={activeTab === 'search'}
                aria-label={t('player.tabSearch')}
                onClick={() => setActiveTab('search')}
                className={`min-h-[44px] flex items-center gap-1.5 px-3.5 py-2 text-xs font-mono transition whitespace-nowrap border ${
                  activeTab === 'search'
                    ? 'bg-[#FF4D2E] text-[#0A0A0A] border-[#FF4D2E] font-bold'
                    : 'bg-[#151515] hover:bg-[#1E1E1E] text-[#A0A09C] hover:text-[#F5F3EE] border-[#2A2A2A]'
                }`}
              >
                <Search className="w-3.5 h-3.5" />
                <span>{t('player.tabSearch')}</span>
              </button>

              <button
                role="tab"
                aria-selected={activeTab === 'queue'}
                aria-label={t('player.tabQueue')}
                onClick={() => setActiveTab('queue')}
                className={`min-h-[44px] flex items-center gap-1.5 px-3.5 py-2 text-xs font-mono transition whitespace-nowrap border ${
                  activeTab === 'queue'
                    ? 'bg-[#FF4D2E] text-[#0A0A0A] border-[#FF4D2E] font-bold'
                    : 'bg-[#151515] hover:bg-[#1E1E1E] text-[#A0A09C] hover:text-[#F5F3EE] border-[#2A2A2A]'
                }`}
              >
                <ListMusic className="w-3.5 h-3.5" />
                <span>{t('player.tabQueue')}</span>
                {queue.length > 0 && (
                  <span className={`px-1.5 py-0.5 text-[10px] font-mono ${
                    activeTab === 'queue' ? 'bg-[#0A0A0A] text-[#FF4D2E]' : 'bg-[#222222] text-[#F5F3EE]'
                  }`}>
                    {queue.length}
                  </span>
                )}
              </button>

              <button
                role="tab"
                aria-selected={activeTab === 'chat'}
                aria-label={t('player.tabChat')}
                onClick={() => setActiveTab('chat')}
                className={`min-h-[44px] flex items-center gap-1.5 px-3.5 py-2 text-xs font-mono transition whitespace-nowrap border relative ${
                  activeTab === 'chat'
                    ? 'bg-[#FF4D2E] text-[#0A0A0A] border-[#FF4D2E] font-bold'
                    : 'bg-[#151515] hover:bg-[#1E1E1E] text-[#A0A09C] hover:text-[#F5F3EE] border-[#2A2A2A]'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>{t('player.tabChat')}</span>
                {unreadChatCount > 0 ? (
                  <span className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-[#FF4D2E] text-[#0A0A0A] animate-pulse">
                    +{unreadChatCount}
                  </span>
                ) : chatMessages.length > 0 ? (
                  <span className={`px-1.5 py-0.5 text-[10px] font-mono ${
                    activeTab === 'chat' ? 'bg-[#0A0A0A] text-[#FF4D2E]' : 'bg-[#222222] text-[#A0A09C]'
                  }`}>
                    {chatMessages.length}
                  </span>
                ) : null}
              </button>

              <button
                role="tab"
                aria-selected={activeTab === 'participants'}
                aria-label={t('player.tabParticipants')}
                onClick={() => setActiveTab('participants')}
                className={`min-h-[44px] flex items-center gap-1.5 px-3.5 py-2 text-xs font-mono transition whitespace-nowrap border ${
                  activeTab === 'participants'
                    ? 'bg-[#FF4D2E] text-[#0A0A0A] border-[#FF4D2E] font-bold'
                    : 'bg-[#151515] hover:bg-[#1E1E1E] text-[#A0A09C] hover:text-[#F5F3EE] border-[#2A2A2A]'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>{t('player.tabParticipants')}</span>
                <span className={`px-1.5 py-0.5 text-[10px] font-mono ${
                  activeTab === 'participants' ? 'bg-[#0A0A0A] text-[#FF4D2E]' : 'bg-[#222222] text-[#A0A09C]'
                }`}>
                  {participants.length}
                </span>
              </button>

              <button
                role="tab"
                aria-selected={activeTab === 'telemetry'}
                aria-label={t('player.tabTelemetry')}
                onClick={() => setActiveTab('telemetry')}
                className={`min-h-[44px] flex items-center gap-1.5 px-3.5 py-2 text-xs font-mono transition whitespace-nowrap border ${
                  activeTab === 'telemetry'
                    ? 'bg-[#FF4D2E] text-[#0A0A0A] border-[#FF4D2E] font-bold'
                    : 'bg-[#151515] hover:bg-[#1E1E1E] text-[#A0A09C] hover:text-[#F5F3EE] border-[#2A2A2A]'
                }`}
              >
                <Activity className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{t('player.tabTelemetry')}</span>
              </button>
            </div>
          </div>

          {/* Kandungan Tab Aktif */}
          <div className="flex-1 min-h-0 overflow-hidden">
            {activeTab === 'search' && (
              <TrackSearch
                currentTrackId={currentTrack?.id}
                onPlayTrack={onSelectTrack}
                onAddToQueue={onAddToQueue}
                onSearchJamendo={onSearchJamendo}
              />
            )}

            {activeTab === 'queue' && (
              <QueueList
                queue={queue}
                currentTrack={currentTrack}
                isHost={isHost}
                onPlayTrack={onSelectTrack}
                onRemoveFromQueue={onRemoveFromQueue}
                onClearQueue={onClearQueue}
                onSwitchToSearch={() => setActiveTab('search')}
              />
            )}

            {activeTab === 'chat' && (
              <RoomChat
                messages={chatMessages}
                currentUserId={currentUserId}
                roomId={roomId}
                onSendMessage={onSendMessage}
                onSendReaction={onSendReaction}
              />
            )}

            {activeTab === 'participants' && (
              <UserList
                participants={participants}
                currentUserId={currentUserId}
                roomId={roomId}
                isHost={isHost}
                onEditUsername={onChangeUsername}
              />
            )}

            {activeTab === 'telemetry' && (
              <div className="flex flex-col h-full gap-4 overflow-y-auto text-xs text-[#A0A09C] pr-1">
                <div className="bg-[#0C0C0C] border border-[#222222] p-4 flex flex-col gap-3">
                  <h4 className="font-bold text-[#F5F3EE] text-sm flex items-center gap-2 font-mono">
                    <Activity className="w-4 h-4 text-[#A8E6CF]" />
                    <span>{t('telemetry.title')}</span>
                  </h4>

                  <div className="grid grid-cols-2 gap-3 font-mono">
                    <div className="p-3 bg-[#141414] border border-[#282828]">
                      <span className="text-[10px] text-[#8E8E8A] uppercase block">{t('telemetry.rtt')}</span>
                      <span className="text-base text-[#A8E6CF] font-bold">
                        {(syncStats.latency * 2).toFixed(1)} MS
                      </span>
                    </div>

                    <div className="p-3 bg-[#141414] border border-[#282828]">
                      <span className="text-[10px] text-[#8E8E8A] uppercase block">{t('telemetry.clockOffset')}</span>
                      <span className="text-base text-[#F5F3EE] font-bold">
                        {syncStats.offset.toFixed(1)} MS
                      </span>
                    </div>

                    <div className="p-3 bg-[#141414] border border-[#282828]">
                      <span className="text-[10px] text-[#8E8E8A] uppercase block">{t('telemetry.audioDrift')}</span>
                      <span className="text-base text-[#FF4D2E] font-bold">
                        {(syncStats.drift * 1000).toFixed(0)} MS
                      </span>
                    </div>

                    <div className="p-3 bg-[#141414] border border-[#282828]">
                      <span className="text-[10px] text-[#8E8E8A] uppercase block">{t('telemetry.driftThreshold')}</span>
                      <span className="text-base text-[#A0A09C] font-bold">
                        {t('telemetry.thresholdValue')}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-[#0C0C0C] border border-[#222222] p-4 flex flex-col gap-2">
                  <h5 className="font-bold text-[#F5F3EE] text-xs font-mono">{t('telemetry.algoTitle')}</h5>
                  <p className="text-[#A0A09C] text-[11px] leading-relaxed">
                    {t('telemetry.algoDesc1')}
                  </p>
                  <code className="p-2 bg-[#141414] border border-[#282828] text-[#A8E6CF] font-mono text-[10px] block">
                    expectedPosition = serverPosition + ((currentTime - serverTimestamp) / 1000)
                  </code>
                  <p className="text-[#A0A09C] text-[11px] leading-relaxed">
                    {t('telemetry.algoDesc2')}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Butang Akses Sembang Cepat (Quick Access Floating Pill) */}
      {activeTab !== 'chat' && (
        <button
          type="button"
          onClick={() => setActiveTab('chat')}
          title={t('player.chatPill')}
          aria-label={t('player.chatPill')}
          className="lg:hidden fixed bottom-6 right-6 z-30 min-h-[44px] flex items-center gap-2.5 px-4 py-3 bg-[#FF4D2E] hover:bg-[#ff6145] text-[#0A0A0A] font-bold text-xs font-mono shadow-2xl transition-all duration-200 cursor-pointer border border-[#0A0A0A]"
        >
          <MessageSquare className="w-4 h-4 fill-current" />
          <span>{t('player.chatPill')}</span>
          {unreadChatCount > 0 ? (
            <span className="px-1.5 py-0.5 bg-[#0A0A0A] text-[#FF4D2E] text-[10px] font-mono font-bold animate-bounce">
              +{unreadChatCount}
            </span>
          ) : chatMessages.length > 0 ? (
            <span className="px-1.5 py-0.5 bg-[#0A0A0A]/30 text-[#0A0A0A] text-[10px] font-mono font-bold">
              {chatMessages.length}
            </span>
          ) : null}
        </button>
      )}
    </div>
  );
};
