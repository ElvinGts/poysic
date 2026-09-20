/**
 * client/src/components/ui/UsernameModal.tsx
 * Tujuan: Modal dialog pemilihan nama pengguna dan avatar semasa menyertai bilik atau menukar profil dalam bilik.
 */
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
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
      setError(t('modal.errorMin'));
      return;
    }
    if (trimmed.length > 24) {
      setError(t('modal.errorMax'));
      return;
    }
    setError('');
    onSave(trimmed, avatar);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="bg-[#0E0E0E] border border-[#262626] rounded-none w-full max-w-md overflow-hidden shadow-2xl flex flex-col font-sans">
        {/* Kepala Modal */}
        <div className="p-6 border-b border-[#222222] flex items-center justify-between bg-[#0A0A0A]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-none bg-[#171717] border border-[#2E2E2E] text-[#FF4D2E] flex items-center justify-center">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-normal text-[#F5F3EE] text-lg font-editorial">
                {isJoining ? t('modal.usernameTitleJoin') : t('modal.usernameTitleUpdate')}
              </h3>
              <p className="text-xs text-[#8E8E8A] font-mono">
                {targetRoomId
                  ? t('modal.usernameDescJoin', { roomId: targetRoomId })
                  : t('modal.usernameDescUpdate')}
              </p>
            </div>
          </div>
          {onClose && !isJoining && (
            <button
              onClick={onClose}
              aria-label={t('modal.close')}
              className="min-h-[44px] min-w-[44px] p-2 text-[#8E8E8A] hover:text-[#F5F3EE] rounded-none hover:bg-[#1A1A1A] transition flex items-center justify-center"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Borang Input */}
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-5">
          {/* Pratonton Avatar & Nama */}
          <div className="flex items-center gap-4 p-3.5 bg-[#0A0A0A] border border-[#242424] rounded-none">
            <div className="text-3xl p-2.5 bg-[#171717] border border-[#2E2E2E] rounded-none flex-shrink-0">
              {avatar}
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[10px] uppercase font-bold text-[#8E8E8A] block font-mono">
                {t('modal.previewProfile')}
              </span>
              <p className="font-bold text-[#F5F3EE] text-sm truncate font-mono">
                {username.trim() || 'Nama Pilihan Anda'}
              </p>
              <span className="text-[11px] text-[#A8E6CF] font-mono">
                {targetRoomId ? `#${targetRoomId}` : t('modal.readyToSync')}
              </span>
            </div>
            <button
              type="button"
              onClick={handleRandomize}
              title={t('modal.randomBtn')}
              aria-label={t('modal.randomBtn')}
              className="min-h-[44px] flex items-center gap-1.5 text-xs text-[#8E8E8A] hover:text-[#FF4D2E] bg-[#141414] border border-[#262626] hover:border-[#383838] px-3 py-2 rounded-none transition font-mono"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span className="text-[11px]">{t('modal.randomBtn')}</span>
            </button>
          </div>

          {/* Kotak Input Nama */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-mono text-[#A0A09C]">
              {t('modal.nameLabel')}
            </label>
            <input
              type="text"
              autoFocus
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                if (error) setError('');
              }}
              placeholder={t('modal.namePlaceholder')}
              maxLength={24}
              aria-label={t('modal.nameLabel')}
              className="w-full bg-[#0A0A0A] border border-[#262626] focus:border-[#FF4D2E] rounded-none px-4 py-2.5 text-sm text-[#F5F3EE] placeholder-[#666666] focus:outline-none font-mono transition"
            />
            {error && (
              <span className="text-xs text-[#FF4D2E] font-medium pl-1 font-mono">
                {error}
              </span>
            )}
            <span className="text-[11px] text-[#8E8E8A] pl-1 font-mono">
              {t('modal.nameHelp')}
            </span>
          </div>

          {/* Pemilih Avatar */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-mono text-[#A0A09C]">
              {t('modal.avatarLabel')}
            </label>
            <div className="grid grid-cols-8 gap-2 p-2 bg-[#0A0A0A] border border-[#242424] rounded-none">
              {AVATAR_LIST.map((av) => (
                <button
                  key={av}
                  type="button"
                  onClick={() => setAvatar(av)}
                  aria-label={`Avatar ${av}`}
                  className={`min-h-[44px] min-w-[44px] text-xl p-2 rounded-none transition flex items-center justify-center border ${
                    avatar === av
                      ? 'bg-[#1C120C] border-[#FF4D2E] scale-105 shadow'
                      : 'hover:bg-[#1A1A1A] border-transparent'
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
                aria-label={isJoining ? t('modal.cancel') : t('modal.close')}
                className="min-h-[44px] flex-1 px-4 py-2.5 bg-[#171717] hover:bg-[#222222] text-[#A0A09C] hover:text-[#F5F3EE] rounded-none font-bold text-xs font-mono border border-[#2E2E2E] transition flex items-center justify-center"
              >
                {isJoining ? t('modal.cancel') : t('modal.close')}
              </button>
            )}
            <button
              type="submit"
              aria-label={isJoining ? t('modal.joinNow') : t('modal.saveChanges')}
              className="min-h-[44px] flex-1 px-4 py-2.5 bg-[#FF4D2E] hover:bg-[#ff6145] text-[#0A0A0A] rounded-none font-bold text-xs font-mono shadow-lg transition flex items-center justify-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>{isJoining ? t('modal.joinNow') : t('modal.saveChanges')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
