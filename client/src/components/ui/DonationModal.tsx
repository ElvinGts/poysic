/**
 * client/src/components/ui/DonationModal.tsx
 * Tujuan: Modal sokongan sumbangan (Saweria) dengan ikrar Zero Ads PoySic.
 */
import React from 'react';
import { X, Heart, ExternalLink, Coffee } from 'lucide-react';

interface DonationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DonationModal: React.FC<DonationModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden p-6 animate-fadeIn">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-amber-400">
            <Heart className="w-5 h-5 fill-current" />
            <h3 className="font-bold text-white text-base">Sokong Projek PoySic</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4 text-xs sm:text-sm text-slate-300 leading-relaxed">
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center gap-3 text-amber-300">
            <Coffee className="w-8 h-8 flex-shrink-0 text-amber-400" />
            <div>
              <p className="font-semibold text-white text-xs">Model Berasaskan Sumbangan</p>
              <p className="text-[11px] text-amber-200/90">
                PoySic dijamin 100% tanpa iklan komersial selamanya.
              </p>
            </div>
          </div>

          <p>
            PoySic dibangunkan secara ikhlas untuk membantu pasangan, keluarga, dan kawan baik berkongsi saat mendengar muzik serentak walaupun terpisah oleh jarak.
          </p>

          <p className="text-slate-400 text-xs">
            Sumbangan anda melalui <strong>Saweria</strong> membantu kami mengekalkan pelayan masa nyata WebSocket, integrasi API Jamendo, dan kelajuan sambungan berlatensi rendah.
          </p>

          <div className="pt-2">
            <a
              href="https://saweria.co"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition active:scale-98"
            >
              <span>Buka Halaman Saweria</span>
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-slate-800/80 text-center">
          <p className="text-[11px] text-slate-500">
            Terima kasih kerana menyokong projek terbuka & bebas iklan! ❤️
          </p>
        </div>
      </div>
    </div>
  );
};
