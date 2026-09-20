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
      <div className="bg-[#0C0C0C] border border-[#242424] rounded-none p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#A8E6CF] animate-pulse" />
            <h3 className="font-bold text-[#F5F3EE] text-sm font-mono uppercase tracking-wider">
              Peserta PoySic ({participants.length})
            </h3>
          </div>
          <p className="text-xs text-[#8E8E8A] mt-0.5 font-mono">
            Semua pendengar dalam bilik ini mendengar pada saat yang disegerakkan.
          </p>
        </div>

        <button
          onClick={handleCopyLink}
          aria-label="Salin pautan jemputan bilik"
          className="flex items-center gap-1.5 px-3 py-2 bg-[#171717] hover:bg-[#222222] text-[#A8E6CF] border border-[#2E2E2E] rounded-none text-xs font-mono font-bold transition shrink-0"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-[#A8E6CF]" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copied ? 'PAUTAN DISALIN' : 'JEMPUT RAKAN'}</span>
        </button>
      </div>

      {/* Senarai Peserta */}
      <div className="flex flex-col gap-2">
        {participants.length === 0 ? (
          <div className="text-center py-10 text-[#8E8E8A] text-xs font-mono">
            <Users className="w-6 h-6 mx-auto mb-2 opacity-40 text-[#8E8E8A]" />
            <p>Memuat senarai peserta...</p>
          </div>
        ) : (
          participants.map((p) => {
            const isMe = p.id === currentUserId;

            return (
              <div
                key={p.id}
                className={`flex items-center justify-between p-3.5 rounded-none border transition ${
                  isMe
                    ? 'bg-[#16241E]/20 border-[#A8E6CF]/40'
                    : 'bg-[#111111] border-[#242424] hover:border-[#333333]'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative">
                    <span className="text-xl p-2 bg-[#171717] border border-[#2E2E2E] rounded-none inline-block">
                      {p.avatar || '🎧'}
                    </span>
                    <span className="absolute -bottom-1 -right-1 w-2.5 h-2.5 bg-[#A8E6CF] rounded-full border-2 border-[#0A0A0A]" />
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[#F5F3EE] text-xs sm:text-sm truncate">
                        {p.name}
                      </span>
                      {isMe && (
                        <span className="px-1.5 py-0.5 rounded-none text-[10px] font-mono font-bold bg-[#16241E] text-[#A8E6CF] border border-[#244537] shrink-0">
                          ANDA
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 mt-0.5 text-[11px] text-[#8E8E8A] font-mono">
                      <span className="flex items-center gap-1">
                        {p.isHost ? (
                          <span className="flex items-center gap-1 text-[#FF4D2E] font-medium">
                            <Crown className="w-3 h-3" />
                            Hos Bilik
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-[#8E8E8A]">
                            <Headphones className="w-3 h-3 text-[#666666]" />
                            Pendengar
                          </span>
                        )}
                      </span>
                      <span>&bull;</span>
                      <span className="flex items-center gap-1 font-mono text-[10px] text-[#8E8E8A]">
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
                    aria-label="Tukar nama panggilan atau avatar anda"
                    className="flex items-center gap-1 text-xs font-mono text-[#A0A09C] hover:text-[#F5F3EE] bg-[#171717] hover:bg-[#222222] px-2.5 py-1.5 rounded-none border border-[#2E2E2E] transition shrink-0 ml-2"
                  >
                    <Edit3 className="w-3 h-3" />
                    <span className="text-[11px] hidden sm:inline">TUKAR</span>
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
