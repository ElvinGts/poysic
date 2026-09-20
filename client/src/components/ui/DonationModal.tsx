/**
 * client/src/components/ui/DonationModal.tsx
 * Tujuan: Modal sokongan sumbangan (Saweria) dengan ikrar Zero Ads PoySic.
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
import { X, Heart, ExternalLink, Coffee } from 'lucide-react';

interface DonationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DonationModal: React.FC<DonationModalProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#0E0E0E] border border-[#262626] rounded-none w-full max-w-md shadow-2xl overflow-hidden p-6 animate-fadeIn font-sans">
        <div className="flex items-center justify-between mb-4 border-b border-[#222222] pb-3">
          <div className="flex items-center gap-2 text-[#FF4D2E]">
            <Heart className="w-5 h-5 fill-current" />
            <h3 className="font-normal text-[#F5F3EE] text-lg font-editorial">{t('modal.donationTitle')}</h3>
          </div>
          <button
            onClick={onClose}
            aria-label={t('modal.close')}
            className="min-h-[44px] min-w-[44px] p-2 text-[#8E8E8A] hover:text-[#F5F3EE] rounded-none hover:bg-[#1A1A1A] transition flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4 text-xs sm:text-sm text-[#A0A09C] leading-relaxed">
          <div className="p-3 bg-[#1C120C] border border-[#FF4D2E]/60 rounded-none flex items-center gap-3 text-[#FF9B85]">
            <Coffee className="w-8 h-8 flex-shrink-0 text-[#FF4D2E]" />
            <div>
              <p className="font-bold text-[#F5F3EE] text-xs font-mono uppercase">{t('modal.donationModel')}</p>
              <p className="text-[11px] text-[#FF9B85] font-mono">
                {t('modal.donationPledge')}
              </p>
            </div>
          </div>

          <p>
            {t('modal.donationDesc1')}
          </p>

          <p className="text-[#8E8E8A] text-xs">
            {t('modal.donationDesc2')}
          </p>

          <div className="pt-2">
            <a
              href="https://saweria.co"
              target="_blank"
              rel="noopener noreferrer"
              aria-label={t('modal.openSaweria')}
              className="min-h-[44px] w-full py-3 bg-[#FF4D2E] hover:bg-[#ff6145] text-[#0A0A0A] font-bold rounded-none flex items-center justify-center gap-2 shadow-lg transition active:scale-98 font-mono text-xs"
            >
              <span>{t('modal.openSaweria')}</span>
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-[#222222] text-center">
          <p className="text-[11px] font-mono text-[#8E8E8A]">
            {t('modal.donationThankYou')}
          </p>
        </div>
      </div>
    </div>
  );
};
