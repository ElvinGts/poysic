/**
 * client/src/components/ui/Navbar.tsx
 * Tujuan: Bar navigasi utama PoySic dengan tipografi editorial, status Cristian sync, dan kawalan bilik.
 */
import React, { useState } from 'react';
import { Disc3, Heart, Copy, Check, Users, BookOpen, LogOut, RefreshCw, Wifi, WifiOff, Globe } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { SyncStats, Participant } from '../../types';
import { SUPPORTED_LANGUAGES, SupportedLanguageCode } from '../../i18n';

interface NavbarProps {
  currentRoomId: string | null;
  participants: Participant[];
  syncStats: SyncStats;
  isConnected: boolean;
  username?: string;
  avatar?: string;
  onChangeUsername?: () => void;
  onLeaveRoom: () => void;
  onForceSync: () => void;
  onOpenDocs: () => void;
  onOpenDonation: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentRoomId,
  participants,
  syncStats,
  isConnected,
  username,
  avatar,
  onChangeUsername,
  onLeaveRoom,
  onForceSync,
  onOpenDocs,
  onOpenDonation,
}) => {
  const { t, i18n } = useTranslation();
  const [copied, setCopied] = useState(false);
  const currentLang = i18n.language?.split('-')[0] || 'en';

  const handleLanguageChange = (langCode: SupportedLanguageCode) => {
    i18n.changeLanguage(langCode);
    localStorage.setItem('poysic_lng', langCode);
  };

  const handleCopyLink = () => {
    if (!currentRoomId) return;
    const url = `${window.location.origin}?room=${currentRoomId}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <header className="border-b border-[#1F1F1F] bg-[#0A0A0A]/95 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
        {/* Jenama PoySic */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              if (currentRoomId) {
                if (confirm(t('nav.confirmLeave'))) {
                  onLeaveRoom();
                }
              }
            }}
            aria-label="PoySic Home"
            className="flex items-center gap-2.5 text-left group"
          >
            <div className="p-2 bg-[#171717] text-[#FF4D2E] border border-[#2E2E2E]">
              <Disc3 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-normal tracking-tight text-[#F5F3EE] font-editorial">
                  PoySic
                </span>
                <span className="text-[10px] font-mono tracking-wider px-1.5 py-0 bg-[#16241E] text-[#A8E6CF] border border-[#244537]">
                  {t('nav.syncBadge')}
                </span>
              </div>
              <p className="hidden md:block text-[10px] font-mono text-[#8E8E8A]">
                {t('nav.slogan')}
              </p>
            </div>
          </button>
        </div>

        {/* Tengah: Maklumat Bilik Aktif (Jika dalam room) */}
        {currentRoomId && (
          <div className="flex items-center gap-2 sm:gap-3 bg-[#111111] border border-[#242424] px-3 py-1.5 text-xs font-mono">
            <span className="text-[#A0A09C] hidden sm:inline text-[11px]">{t('nav.room')}</span>
            <span className="font-bold text-[#F5F3EE] tracking-wide">
              {currentRoomId}
            </span>
            <button
              onClick={handleCopyLink}
              title={t('player.shareRoom')}
              aria-label={t('player.shareRoom')}
              className="min-h-[44px] min-w-[44px] p-1.5 hover:bg-[#202020] text-[#A0A09C] hover:text-[#F5F3EE] transition flex items-center justify-center gap-1"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-[#A8E6CF]" /> : <Copy className="w-3.5 h-3.5" />}
              <span className="hidden lg:inline text-[10px]">{copied ? t('nav.copied') : t('nav.copy')}</span>
            </button>

            <div className="h-3 w-px bg-[#262626] mx-1 hidden sm:block" />

            {/* Bilangan Pendengar */}
            <div className="flex items-center gap-1.5 text-[#F5F3EE]" title={`${participants.length} ${t('nav.listeners')}`}>
              <Users className="w-3.5 h-3.5 text-[#A8E6CF]" />
              <span className="font-bold">{participants.length}</span>
            </div>

            <div className="h-3 w-px bg-[#262626] mx-1 hidden md:block" />

            {/* Status Sambungan & Ping */}
            <button
              type="button"
              className="hidden md:flex items-center gap-1.5 cursor-pointer hover:opacity-80 bg-transparent border-0 min-h-[44px] px-2"
              onClick={onForceSync}
              aria-label={t('nav.forceSync', { latency: Math.round(syncStats.latency), offset: Math.round(syncStats.offset) })}
              title={t('nav.forceSync', { latency: Math.round(syncStats.latency), offset: Math.round(syncStats.offset) })}
            >
              {isConnected ? (
                <Wifi className="w-3.5 h-3.5 text-[#A8E6CF]" />
              ) : (
                <WifiOff className="w-3.5 h-3.5 text-[#FF4D2E]" />
              )}
              <span className="text-[10px] text-[#A0A09C]">
                {Math.round(syncStats.latency)}MS
              </span>
            </button>
          </div>
        )}

        {/* Kanan: Bahasa, Aksi Bantuan, Saweria & Exit */}
        <div className="flex items-center gap-2">
          {/* Pemilih Bahasa (Language Selector) */}
          <div className="relative flex items-center">
            <label htmlFor="language-select" className="sr-only">
              Language
            </label>
            <div className="flex items-center bg-[#141414] border border-[#2A2A2A] hover:border-[#444444] transition px-2.5 min-h-[44px]">
              <Globe className="w-3.5 h-3.5 text-[#A0A09C] mr-1.5 shrink-0" />
              <select
                id="language-select"
                value={currentLang}
                onChange={(e) => handleLanguageChange(e.target.value as SupportedLanguageCode)}
                aria-label="Select Language"
                className="bg-transparent text-xs font-mono text-[#F5F3EE] focus:outline-none cursor-pointer h-[44px] min-w-[44px] pr-1"
              >
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <option key={lang.code} value={lang.code} className="bg-[#141414] text-[#F5F3EE]">
                    {lang.flag} {lang.short}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {currentRoomId && username && onChangeUsername && (
            <button
              onClick={onChangeUsername}
              title={t('player.change')}
              aria-label={t('player.change')}
              className="min-h-[44px] flex items-center gap-2 px-3 py-1.5 bg-[#141414] hover:bg-[#1E1E1E] border border-[#2A2A2A] text-xs font-mono text-[#F5F3EE] transition"
            >
              <span className="px-1 bg-[#222222] text-[#FF4D2E] text-[10px] font-bold">{avatar || 'LP'}</span>
              <span className="font-bold text-[#F5F3EE] max-w-[90px] truncate hidden sm:inline">
                {username}
              </span>
            </button>
          )}

          {currentRoomId && (
            <button
              onClick={onForceSync}
              title={t('player.resync')}
              aria-label={t('player.resync')}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center p-2 text-[#A0A09C] hover:text-[#A8E6CF] hover:bg-[#1A1A1A] border border-transparent hover:border-[#2E2E2E] transition"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={onOpenDocs}
            title={t('nav.docs')}
            aria-label={t('nav.docs')}
            className="min-h-[44px] flex items-center gap-1.5 text-xs font-mono text-[#A0A09C] hover:text-[#F5F3EE] bg-[#141414] hover:bg-[#1C1C1C] border border-[#2A2A2A] px-3.5 py-1.5 transition"
          >
            <BookOpen className="w-3.5 h-3.5 text-[#A0A09C]" />
            <span className="hidden sm:inline">{t('nav.docs')}</span>
          </button>

          <button
            onClick={onOpenDonation}
            aria-label={t('nav.saweria')}
            className="min-h-[44px] flex items-center gap-1.5 text-xs font-mono font-bold bg-[#FF4D2E] hover:bg-[#ff6145] text-[#0A0A0A] px-3.5 py-1.5 transition"
          >
            <Heart className="w-3.5 h-3.5 fill-current" />
            <span className="hidden sm:inline">{t('nav.saweria')}</span>
          </button>

          {currentRoomId && (
            <button
              onClick={onLeaveRoom}
              title={t('nav.leave')}
              aria-label={t('nav.leave')}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center p-2 text-[#A0A09C] hover:text-[#FF4D2E] hover:bg-[#2A1412] border border-[#2E2E2E] transition ml-1"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
