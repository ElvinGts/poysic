/**
 * client/src/components/ui/UsernameModal.tsx
 * Tujuan: Modal dialog pemilihan nama pengguna dan avatar semasa menyertai bilik atau menukar profil dalam bilik.
 */
import React, { useState, useEffect } from 'react';
import { User, Sparkles, Check, X } from 'lucide-react';

interface UsernameModalProps {
  isOpen: boolean;
  initialUsername?: string;
  currentUsername?: string;
  initialAvatar?: string;
  currentAvatar?: string;
  targetRoomId?: string | null;
  isJoining?: boolean;
  onSave: (username: string, avatar: string) => void;
  onClose?: () => void;
}

const AVATAR_LIST = [
  '🎧', '🌙', '☕', '🐱', '🐻', '🌸', '⚡', '🎸',
  '✨', '🦊', '🚀', '🐼', '🎶', '🍉', '🐶', '🍕',
];

const RANDOM_NAMES = [
  'Pencinta Muzik',
  'Melodi Malam',
  'Nada Rindu',
  'Pendengar Santai',
  'Irama Jiwa',
  'Bintang Senja',
  'Sahabat Kopi',
  'Rentak Syahdu',
  'Vibe Tenang',
  'Harmoni Senja',
  'Lagu & Kenangan',
];

export const UsernameModal: React.FC<UsernameModalProps> = ({
  isOpen,
  initialUsername,
  currentUsername,
  initialAvatar,
  currentAvatar,
  targetRoomId,
  isJoining = true,
  onSave,
  onClose,
}) => {
  const defaultName = currentUsername || initialUsername || 'Pendengar PoySic';
  const defaultAv = currentAvatar || initialAvatar || '🎧';

  const [username, setUsername] = useState(defaultName);
  const [avatar, setAvatar] = useState(defaultAv);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setUsername(currentUsername || initialUsername || 'Pendengar PoySic');
      setAvatar(currentAvatar || initialAvatar || '🎧');
      setError('');
    }
  }, [isOpen, currentUsername, initialUsername, currentAvatar, initialAvatar]);

  if (!isOpen) return null;

  const handleRandomize = () => {
    const randomName = RANDOM_NAMES[Math.floor(Math.random() * RANDOM_NAMES.length)];
    const randomAvatar = AVATAR_LIST[Math.floor(Math.random() * AVATAR_LIST.length)];
    const num = Math.floor(10 + Math.random() * 90);
    setUsername(`${randomName} ${num}`);
    setAvatar(randomAvatar);
    setError('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = username.trim();
    if (trimmed.length < 2) {
      setError('Sila masukkan sekurang-kurangnya 2 huruf.');
      return;
    }
    if (trimmed.length > 24) {
      setError('Nama dihadkan kepada 24 aksara.');
      return;
    }
    setError('');
    onSave(trimmed, avatar);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col">
        {/* Kepala Modal */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">
                {isJoining ? 'Pilih Nama Pengguna Anda' : 'Kemaskini Nama Pengguna'}
              </h3>
              <p className="text-xs text-slate-400">
                {targetRoomId
                  ? `Menyertai bilik tersinkron: #${targetRoomId}`
                  : 'Nama ini dipaparkan kepada rakan pendengar'}
              </p>
            </div>
          </div>
          {onClose && !isJoining && (
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Borang Input */}
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-5">
          {/* Pratonton Avatar & Nama */}
          <div className="flex items-center gap-4 p-3.5 bg-slate-950/60 border border-slate-800/80 rounded-2xl">
            <div className="text-3xl p-2.5 bg-slate-800 border border-slate-700/80 rounded-2xl flex-shrink-0">
              {avatar}
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">
                Pratonton Profil Bilik:
              </span>
              <p className="font-bold text-white text-sm truncate">
                {username.trim() || 'Nama Pilihan Anda'}
              </p>
              <span className="text-[11px] text-emerald-400 font-mono">
                {targetRoomId ? `Bilik: ${targetRoomId}` : 'Bersedia untuk sync'}
              </span>
            </div>
            <button
              type="button"
              onClick={handleRandomize}
              title="Jana nama dan avatar rawak"
              className="flex items-center gap-1 text-xs text-slate-400 hover:text-emerald-400 bg-slate-900 border border-slate-800 hover:border-slate-700 px-2.5 py-2 rounded-xl transition"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span className="text-[11px]">Rawak</span>
            </button>
          </div>

          {/* Kotak Input Nama */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-300">
              Nama Panggilan / Samaran:
            </label>
            <input
              type="text"
              autoFocus
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                if (error) setError('');
              }}
              placeholder="Contoh: Azim, Farah, DJ Malam..."
              maxLength={24}
              className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none transition"
            />
            {error && (
              <span className="text-xs text-rose-400 font-medium pl-1">
                {error}
              </span>
            )}
            <span className="text-[11px] text-slate-500 pl-1">
              Nama ini akan kelihatan pada kawalan pemain audio, senarai peserta, dan sembang masa nyata.
            </span>
          </div>

          {/* Pemilih Avatar */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-slate-300">
              Pilih Ikon Avatar:
            </label>
            <div className="grid grid-cols-8 gap-2 p-2 bg-slate-950/40 border border-slate-800/80 rounded-2xl">
              {AVATAR_LIST.map((av) => (
                <button
                  key={av}
                  type="button"
                  onClick={() => setAvatar(av)}
                  className={`text-xl p-2 rounded-xl transition flex items-center justify-center ${
                    avatar === av
                      ? 'bg-emerald-500/20 border border-emerald-500/60 scale-110 shadow'
                      : 'hover:bg-slate-800 border border-transparent'
                  }`}
                >
                  {av}
                </button>
              ))}
            </div>
          </div>

          {/* Butang Tindakan */}
          <div className="flex items-center gap-3 pt-2">
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold text-xs transition"
              >
                {isJoining ? 'Batal' : 'Tutup'}
              </button>
            )}
            <button
              type="submit"
              className="flex-1 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl font-bold text-xs shadow-lg shadow-emerald-500/20 transition flex items-center justify-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>{isJoining ? 'Sertai Bilik Sekarang' : 'Simpan Perubahan'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
