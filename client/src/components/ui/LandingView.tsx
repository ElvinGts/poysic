/**
 * client/src/components/ui/LandingView.tsx
 * Tujuan: Halaman utama pendaratan (Landing Page) PoySic dengan reka bentuk editorial analog:
 * - Tipografi Instrument Serif (heading dengan aksen italic) & IBM Plex Mono (metadata).
 * - Palet tulen: #0A0A0A canvas, #F5F3EE teks, #FF4D2E aksen vinyl, #A8E6CF mint sync.
 * - Layout tak simetri (65/35), penomboran trek 01/02/03/04, border 0-2px, sifar emoji dalam UI.
 */
import React, { useState } from 'react';
import {
  ArrowRight,
  Sparkles,
  SlidersHorizontal,
  Heart,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface LandingViewProps {
  onJoinRoom: (roomId: string, username: string, avatar: string) => void;
  onOpenDocs: () => void;
  onOpenDonation: () => void;
}

const MONIKER_BADGES = ['LP', 'A1', 'B2', '45', '78', 'SYNC', 'HQ', 'MONO'];

const PRESET_ROOMS = [
  { id: 'couple-lofi', index: '01', title: 'Couple Lo-Fi Session', genre: 'Lo-Fi', tempo: '74 BPM' },
  { id: 'sahabat-night', index: '02', title: 'Acoustic Malam Sahabat', genre: 'Acoustic', tempo: '88 BPM' },
  { id: 'study-together', index: '03', title: 'Fokus & Belajar', genre: 'Piano', tempo: '65 BPM' },
  { id: 'synth-highway', index: '04', title: 'Midnight Analog Highway', genre: 'Synthwave', tempo: '118 BPM' },
];

export const LandingView: React.FC<LandingViewProps> = ({
  onJoinRoom,
  onOpenDocs,
  onOpenDonation,
}) => {
  const { t } = useTranslation();
  const [roomIdInput, setRoomIdInput] = useState('');
  const [username, setUsername] = useState(() => {
    return localStorage.getItem('poysic_username') || 'Pendengar PoySic';
  });
  const [selectedAvatar, setSelectedAvatar] = useState(() => {
    return localStorage.getItem('poysic_avatar') || 'LP';
  });
  const [isCreatingCustom, setIsCreatingCustom] = useState(false);
  const [customRoomName, setCustomRoomName] = useState('');

  const handleUpdateUsername = (newVal: string) => {
    setUsername(newVal);
    localStorage.setItem('poysic_username', newVal);
  };

  const handleUpdateAvatar = (newAv: string) => {
    setSelectedAvatar(newAv);
    localStorage.setItem('poysic_avatar', newAv);
  };

  const generateRandomRoomId = () => {
    const prefixes = ['vibe', 'lepak', 'rindu', 'malam', 'sync', 'nada'];
    const randomPrefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const randomHex = Math.random().toString(36).substring(2, 6);
    return `${randomPrefix}-${randomHex}`;
  };

  const handleCreateInstantRoom = () => {
    const newRoomId = generateRandomRoomId();
    onJoinRoom(newRoomId, username, selectedAvatar);
  };

  const handleCreateNamedRoom = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = (customRoomName.trim() || generateRandomRoomId())
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');
    onJoinRoom(clean, username, selectedAvatar);
  };

  const handleJoinExistingRoom = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = roomIdInput.trim().toLowerCase().replace(/[^a-z0-9-]/g, '');
    if (cleanId) {
      onJoinRoom(cleanId, username, selectedAvatar);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-14 flex flex-col gap-16 text-[#F5F3EE]">
      {/* Layout Tak Simetri (65% / 35%) */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start border-b border-[#222222] pb-14">
        {/* Kolum Kiri (7 Kolum): Editorial Headline & Room Creation */}
        <div className="lg:col-span-7 flex flex-col items-start text-left">
          {/* Metadata Header Bar */}
          <div className="flex items-center gap-3 text-[11px] font-mono tracking-widest text-[#888884] uppercase mb-5">
            <span className="inline-block w-2 h-2 bg-[#FF4D2E]" />
            <span>{t('landing.meta')}</span>
          </div>

          {/* Heading Editorial Berkarakter (Instrument Serif dengan italic aksen) */}
          <h1 className="text-5xl sm:text-7xl lg:text-8xl font-normal tracking-tight text-[#F5F3EE] leading-[1.05] font-editorial">
            {t('landing.titleLine1')} <br />
            <span className="italic text-[#FF4D2E] block mt-1">
              {t('landing.titleLine2')}
            </span>
          </h1>

          <p className="mt-6 text-[#A0A09C] text-base sm:text-lg max-w-xl leading-relaxed">
            {t('landing.subtitle')}
          </p>

          {/* Kad Profil Pendengar (Nama & Moniker Audio) */}
          <div className="mt-8 p-4 bg-[#121212] border border-[#262626] w-full max-w-lg">
            <div className="flex items-center justify-between text-[11px] font-mono text-[#888884] uppercase tracking-wider mb-2">
              <span>{t('landing.listenerIdentity')}</span>
              <span className="text-[#A8E6CF]">{t('landing.autoSaved')}</span>
            </div>

            <div className="flex items-center gap-3">
              <span className="px-2.5 py-1.5 bg-[#1A1A1A] border border-[#333333] font-mono text-xs font-bold text-[#FF4D2E]">
                {selectedAvatar}
              </span>
              <label htmlFor="listener-nickname-input" className="sr-only">
                {t('landing.listenerIdentity')}
              </label>
              <input
                id="listener-nickname-input"
                type="text"
                value={username}
                onChange={(e) => handleUpdateUsername(e.target.value)}
                placeholder={t('landing.namePlaceholder')}
                aria-label={t('landing.listenerIdentity')}
                maxLength={24}
                className="flex-1 bg-[#0A0A0A] border border-[#2A2A2A] focus:border-[#FF4D2E] focus:outline-none px-3 py-2.5 min-h-[44px] text-sm text-[#F5F3EE] font-mono transition"
              />
            </div>

            {/* Pilihan Lencana Moniker (Gaya Plat Audio) */}
            <div className="flex items-center gap-1.5 mt-3 pt-2.5 border-t border-[#1F1F1F] flex-wrap">
              <span className="text-[10px] font-mono text-[#8E8E8A] mr-1">{t('landing.badge')}</span>
              {MONIKER_BADGES.map((badge) => (
                <button
                  key={badge}
                  type="button"
                  onClick={() => handleUpdateAvatar(badge)}
                  aria-label={`Badge ${badge}`}
                  className={`min-h-[44px] min-w-[44px] px-2.5 py-2 text-xs font-mono transition border flex items-center justify-center ${
                    selectedAvatar === badge
                      ? 'bg-[#FF4D2E] text-[#0A0A0A] border-[#FF4D2E] font-bold'
                      : 'bg-[#171717] text-[#A0A09C] border-[#2A2A2A] hover:text-[#F5F3EE] hover:border-[#444444]'
                  }`}
                >
                  {badge}
                </button>
              ))}
            </div>
          </div>

          {/* Butang Tindakan Cipta Bilik */}
          <div className="mt-6 flex flex-col sm:flex-row gap-3 w-full max-w-lg">
            <button
              onClick={handleCreateInstantRoom}
              aria-label={t('landing.instantRoom')}
              className="min-h-[44px] flex-1 flex items-center justify-center gap-2 bg-[#FF4D2E] hover:bg-[#ff6145] text-[#0A0A0A] font-bold py-3 px-5 text-sm tracking-wide transition transform active:translate-y-0.5"
            >
              <Sparkles className="w-4 h-4 fill-current" />
              <span>{t('landing.instantRoom')}</span>
            </button>

            <button
              onClick={() => setIsCreatingCustom(!isCreatingCustom)}
              aria-label={t('landing.customName')}
              className="min-h-[44px] flex items-center justify-center gap-2 bg-[#141414] hover:bg-[#1A1A1A] text-[#F5F3EE] border border-[#2C2C2C] text-sm font-mono px-4 py-3 transition"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-[#A0A09C]" />
              <span>{t('landing.customName')}</span>
            </button>
          </div>

          {/* Borang Nama Khas */}
          {isCreatingCustom && (
            <form
              onSubmit={handleCreateNamedRoom}
              className="mt-3 w-full max-w-lg bg-[#121212] border border-[#FF4D2E]/60 p-3 flex gap-2 animate-fadeIn"
            >
              <label htmlFor="custom-room-name-input" className="sr-only">
                {t('landing.customName')}
              </label>
              <input
                id="custom-room-name-input"
                type="text"
                placeholder={t('landing.customPlaceholder')}
                value={customRoomName}
                onChange={(e) => setCustomRoomName(e.target.value)}
                aria-label={t('landing.customName')}
                className="flex-1 bg-[#0A0A0A] border border-[#262626] focus:border-[#FF4D2E] focus:outline-none px-3 py-2 min-h-[44px] text-xs font-mono text-[#F5F3EE]"
                autoFocus
              />
              <button
                type="submit"
                aria-label={t('landing.enter')}
                className="min-h-[44px] min-w-[44px] bg-[#FF4D2E] hover:bg-[#ff6145] text-[#0A0A0A] font-bold px-4 py-2 text-xs tracking-wider flex items-center justify-center"
              >
                {t('landing.enter')}
              </button>
            </form>
          )}

          {/* Masuk Kod Bilik Sedia Ada */}
          <div className="mt-4 w-full max-w-lg">
            <form onSubmit={handleJoinExistingRoom} className="flex gap-2 items-stretch">
              <label htmlFor="friend-code-input" className="sr-only">
                {t('landing.friendCodePlaceholder')}
              </label>
              <input
                id="friend-code-input"
                type="text"
                placeholder={t('landing.friendCodePlaceholder')}
                value={roomIdInput}
                onChange={(e) => setRoomIdInput(e.target.value)}
                aria-label={t('landing.friendCodePlaceholder')}
                className="flex-1 bg-[#121212] border border-[#262626] focus:border-[#A8E6CF] focus:outline-none px-3.5 py-2.5 min-h-[44px] text-xs font-mono text-[#F5F3EE] placeholder-[#767672]"
              />
              <button
                type="submit"
                disabled={!roomIdInput.trim()}
                aria-label={t('landing.join')}
                className="min-h-[44px] min-w-[44px] px-4 py-2.5 bg-[#1C1C1C] hover:bg-[#252525] disabled:opacity-40 text-[#A8E6CF] border border-[#2E2E2E] transition flex items-center justify-center gap-1.5 font-mono text-xs"
              >
                <span>{t('landing.join')}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>

        {/* Kolum Kanan (5 Kolum): Tracklist Penomboran Album (01, 02, 03, 04) */}
        <div className="lg:col-span-5 bg-[#101010] border border-[#222222] p-5 sm:p-6 flex flex-col gap-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#1E1E1E]">
            <div>
              <div className="text-[10px] font-mono tracking-widest text-[#A0A09C] uppercase">
                {t('landing.gatheringSessions')}
              </div>
              <h2 className="text-xl font-normal text-[#F5F3EE] font-editorial mt-0.5">
                {t('landing.communityRooms')}
              </h2>
            </div>
            <span className="text-[10px] font-mono text-[#A8E6CF] bg-[#16241E] border border-[#244537] px-2 py-0.5">
              {t('landing.live247')}
            </span>
          </div>

          <div className="flex flex-col divide-y divide-[#1A1A1A]">
            {PRESET_ROOMS.map((preset) => (
              <div
                key={preset.id}
                onClick={() => onJoinRoom(preset.id, username, selectedAvatar)}
                className="group py-3.5 flex items-center justify-between cursor-pointer hover:bg-[#151515] px-2 transition -mx-2"
              >
                <div className="flex items-start gap-3">
                  <span className="font-editorial text-2xl text-[#767672] group-hover:text-[#FF4D2E] transition-colors w-7 leading-none">
                    {preset.index}
                  </span>
                  <div>
                    <h3 className="text-sm font-medium text-[#F5F3EE] group-hover:text-[#FF4D2E] transition-colors leading-snug">
                      {preset.title}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] font-mono text-[#A0A09C] uppercase">
                        {preset.genre}
                      </span>
                      <span className="text-[#333333]">•</span>
                      <span className="text-[10px] font-mono text-[#8E8E8A]">
                        {preset.tempo}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] font-mono text-[#A0A09C] group-hover:text-[#A8E6CF] flex items-center gap-1 transition">
                    {t('landing.enterAction')}
                    <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                  </span>
                  <span className="text-[9px] font-mono text-[#767672] block">#{preset.id}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-[#1C1C1C] flex items-center justify-between text-[11px] font-mono text-[#8E8E8A]">
            <span>{t('landing.formatAudio')}</span>
            <span className="text-[#A8E6CF]">{t('landing.driftLimit')}</span>
          </div>
        </div>
      </section>

      {/* Bahagian 2 Kolum Tak Seimbang: Kejuruteraan Audio (60%) & Ikrar Komuniti (40%) */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-7 bg-[#101010] border border-[#222222] p-6 sm:p-8 flex flex-col gap-4">
          <div className="text-[10px] font-mono tracking-widest text-[#A0A09C] uppercase">
            {t('landing.techSpecs')}
          </div>
          <h3 className="text-2xl sm:text-3xl font-normal font-editorial text-[#F5F3EE]">
            {t('landing.techTitle')}
          </h3>
          <p className="text-sm text-[#A0A09C] leading-relaxed">
            {t('landing.techDesc')}
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-4 border-t border-[#1C1C1C]">
            <div>
              <div className="text-[10px] font-mono text-[#8E8E8A] uppercase">{t('landing.latencyBuffer')}</div>
              <div className="text-lg font-mono text-[#A8E6CF] font-bold mt-0.5">~18ms</div>
            </div>
            <div>
              <div className="text-[10px] font-mono text-[#8E8E8A] uppercase">{t('landing.audioFormat')}</div>
              <div className="text-lg font-mono text-[#F5F3EE] font-bold mt-0.5">44.1kHz MP3</div>
            </div>
            <div>
              <div className="text-[10px] font-mono text-[#8E8E8A] uppercase">{t('landing.audioAds')}</div>
              <div className="text-lg font-mono text-[#FF4D2E] font-bold mt-0.5">{t('landing.zeroAdsStat')}</div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-5 bg-[#121212] border border-[#262626] p-6 sm:p-8 flex flex-col justify-between gap-6">
          <div className="flex flex-col gap-3">
            <div className="text-[10px] font-mono tracking-widest text-[#FF4D2E] uppercase flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-[#FF4D2E]" />
              {t('landing.saweriaPledge')}
            </div>
            <h3 className="text-2xl font-normal font-editorial text-[#F5F3EE]">
              {t('landing.saweriaTitle')}
            </h3>
            <p className="text-xs sm:text-sm text-[#A0A09C] leading-relaxed">
              {t('landing.saweriaDesc')}
            </p>
          </div>

          <div className="flex items-center gap-3 pt-4 border-t border-[#202020]">
            <button
              onClick={onOpenDocs}
              aria-label={t('landing.docsBtn')}
              className="min-h-[44px] flex-1 py-2.5 px-3 border border-[#333333] hover:border-[#555555] text-xs font-mono text-[#F5F3EE] transition flex items-center justify-center text-center"
            >
              {t('landing.docsBtn')}
            </button>
            <button
              onClick={onOpenDonation}
              aria-label={t('landing.saweriaBtn')}
              className="min-h-[44px] flex-1 py-2.5 px-3 bg-[#FF4D2E] hover:bg-[#ff6145] text-[#0A0A0A] font-bold text-xs font-mono transition text-center flex items-center justify-center gap-1.5"
            >
              <Heart className="w-3 h-3 fill-current" />
              <span>{t('landing.saweriaBtn')}</span>
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
