/**
 * client/src/components/room/UserList.tsx
 * Tujuan: Memaparkan senarai peserta yang sedang berada dalam bilik dengan status hos, avatar, dan kemaskini nama.
 */
import React from 'react';
import { Users, Crown, Headphones, Copy, Check, Edit3, Clock } from 'lucide-react';
import { Participant } from '../../types';

interface UserListProps {
  participants: Participant[];
  currentUserId: string;
  roomId: string;
  isHost: boolean;
  onEditUsername: () => void;
}

export const UserList: React.FC<UserListProps> = ({
  participants,
  currentUserId,
  roomId,
  onEditUsername,
}) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopyLink = () => {
    const url = `${window.location.origin}?room=${roomId}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const formatJoinedTime = (ts: number) => {
    if (!ts) return 'Baru sahaja';
    const diffSecs = Math.floor((Date.now() - ts) / 1000);
    if (diffSecs < 60) return 'Baru sahaja masuk';
    const diffMins = Math.floor(diffSecs / 60);
    if (diffMins < 60) return `${diffMins} minit lalu`;
    const diffHours = Math.floor(diffMins / 60);
    return `${diffHours} jam lalu`;
  };

  return (
    <div className="flex flex-col h-full gap-4 overflow-y-auto pr-1">
      {/* Kad Info Bilik & Pautan Jemputan */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <h3 className="font-bold text-white text-sm">
              Peserta PoySic ({participants.length})
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Semua pendengar dalam bilik ini mendengar pada saat yang disegerakkan.
          </p>
        </div>

        <button
          onClick={handleCopyLink}
          className="flex items-center gap-1.5 px-3 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-semibold transition shrink-0"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copied ? 'Pautan Disalin!' : 'Jemput Rakan'}</span>
        </button>
      </div>

      {/* Senarai Peserta */}
      <div className="flex flex-col gap-2">
        {participants.length === 0 ? (
          <div className="text-center py-10 text-slate-500 text-xs">
            <Users className="w-6 h-6 mx-auto mb-2 opacity-40 text-slate-400" />
            <p>Memuat senarai peserta...</p>
          </div>
        ) : (
          participants.map((p) => {
            const isMe = p.id === currentUserId;

            return (
              <div
                key={p.id}
                className={`flex items-center justify-between p-3.5 rounded-2xl border transition ${
                  isMe
                    ? 'bg-slate-900/90 border-emerald-500/40 shadow-sm'
                    : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative">
                    <span className="text-2xl p-2 bg-slate-800 border border-slate-700/80 rounded-xl inline-block">
                      {p.avatar || '🎧'}
                    </span>
                    <span className="absolute -bottom-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-slate-900" />
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-xs sm:text-sm truncate">
                        {p.name}
                      </span>
                      {isMe && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shrink-0">
                          Anda
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-400">
                      <span className="flex items-center gap-1">
                        {p.isHost ? (
                          <span className="flex items-center gap-1 text-amber-300 font-medium">
                            <Crown className="w-3 h-3" />
                            Hos Bilik
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-slate-400">
                            <Headphones className="w-3 h-3 text-slate-500" />
                            Pendengar
                          </span>
                        )}
                      </span>
                      <span>&bull;</span>
                      <span className="flex items-center gap-1 font-mono text-[10px] text-slate-500">
                        <Clock className="w-2.5 h-2.5" />
                        {formatJoinedTime(p.joinedAt)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Aksi Ubah Nama jika ini diri sendiri */}
                {isMe && (
                  <button
                    onClick={onEditUsername}
                    title="Tukar nama panggilan atau avatar anda"
                    className="flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 bg-slate-800 hover:bg-slate-700/80 px-2.5 py-1.5 rounded-xl border border-slate-700 transition shrink-0 ml-2"
                  >
                    <Edit3 className="w-3 h-3" />
                    <span className="text-[11px] hidden sm:inline">Tukar Nama</span>
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
