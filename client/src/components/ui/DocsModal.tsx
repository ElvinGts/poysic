/**
 * client/src/components/ui/DocsModal.tsx
 * Tujuan: Modal untuk melihat dokumentasi seni bina, roadmap, dan cara enjin sync PoySic berfungsi.
 */
import React, { useState } from 'react';
import { X, BookOpen, Layers, Compass, Cpu, ShieldCheck } from 'lucide-react';

interface DocsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DocsModal: React.FC<DocsModalProps> = ({ isOpen, onClose }) => {
  const [activeDoc, setActiveDoc] = useState<'architecture' | 'roadmap' | 'sync'>('sync');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#0E0E0E] border border-[#262626] rounded-none w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-fadeIn">
        {/* Header Modal */}
        <div className="p-4 sm:p-5 border-b border-[#222222] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-[#FF4D2E]" />
            <h3 className="font-normal text-[#F5F3EE] text-lg font-editorial">Dokumentasi PoySic</h3>
          </div>
          <button
            onClick={onClose}
            aria-label="Tutup dokumentasi"
            className="p-1 text-[#8E8E8A] hover:text-[#F5F3EE] rounded-none hover:bg-[#1A1A1A] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Pilihan Dokumen */}
        <div className="flex items-center gap-2 px-5 pt-3 border-b border-[#222222] bg-[#0A0A0A]">
          <button
            onClick={() => setActiveDoc('sync')}
            className={`flex items-center gap-1.5 pb-3 px-2 text-xs font-mono font-semibold border-b-2 transition ${
              activeDoc === 'sync'
                ? 'border-[#FF4D2E] text-[#FF4D2E]'
                : 'border-transparent text-[#8E8E8A] hover:text-[#F5F3EE]'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>Enjin Sync & Drift</span>
          </button>

          <button
            onClick={() => setActiveDoc('architecture')}
            className={`flex items-center gap-1.5 pb-3 px-2 text-xs font-mono font-semibold border-b-2 transition ${
              activeDoc === 'architecture'
                ? 'border-[#FF4D2E] text-[#FF4D2E]'
                : 'border-transparent text-[#8E8E8A] hover:text-[#F5F3EE]'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Seni Bina (Architecture)</span>
          </button>

          <button
            onClick={() => setActiveDoc('roadmap')}
            className={`flex items-center gap-1.5 pb-3 px-2 text-xs font-mono font-semibold border-b-2 transition ${
              activeDoc === 'roadmap'
                ? 'border-[#FF4D2E] text-[#FF4D2E]'
                : 'border-transparent text-[#8E8E8A] hover:text-[#F5F3EE]'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Pelan Tindakan (Roadmap)</span>
          </button>
        </div>

        {/* Kandungan Dokumen */}
        <div className="p-5 sm:p-6 overflow-y-auto text-xs sm:text-sm text-[#A0A09C] space-y-4 leading-relaxed font-sans">
          {activeDoc === 'sync' && (
            <div className="space-y-4">
              <h4 className="text-base font-normal text-[#F5F3EE] font-editorial">Cara Enjin Sinkronisasi PoySic Berfungsi</h4>
              <p>
                PoySic menggunakan gabungan <strong className="text-[#F5F3EE]">Algoritma Cristian</strong> dan <strong className="text-[#F5F3EE]">Drift Correction Threshold</strong> untuk memastikan audio bermain serentak antara pasangan atau rakan yang berjauhan:
              </p>

              <div className="bg-[#080808] border border-[#222222] p-4 rounded-none font-mono text-xs text-[#A8E6CF] space-y-1">
                <div>// 1. Kira Latensi & Jam Offset (ms)</div>
                <div>RTT = t1 - t0;</div>
                <div>latency = RTT / 2;</div>
                <div>offset = serverTime - (t1 - latency);</div>
                <div>currentServerTime = Date.now() + offset;</div>
              </div>

              <h5 className="font-bold text-[#F5F3EE] font-mono text-xs mt-3">PEMBETULAN DRIFT (&lt; 0.45 SAAT)</h5>
              <p>
                Pelayan menghantar denyutan degupan (*heartbeat*) setiap 5 saat. Sekiranya perbezaan antara pemain audio anda dan anggaran masa pelayan melebihi 0.45s (contohnya peranti terkunci atau tab terhad jalur lebar), audio dipaksa melompat (*hard seek*) ke saat yang tepat.
              </p>

              <div className="p-3 bg-[#16241E]/30 border border-[#244537] rounded-none text-[#A8E6CF] text-xs flex items-center gap-2 font-mono">
                <ShieldCheck className="w-4 h-4 flex-shrink-0 text-[#A8E6CF]" />
                <span>Zero Ads bermakna tiada iklan yang akan merosakkan sinkronisasi audio pada saat kritikal.</span>
              </div>
            </div>
          )}

          {activeDoc === 'architecture' && (
            <div className="space-y-4">
              <h4 className="text-base font-normal text-[#F5F3EE] font-editorial">Seni Bina Aliran Data PoySic</h4>
              <p>
                Aplikasi distrukturkan mengikut model klien-pelayan berautoriti:
              </p>
              <ul className="list-disc list-inside space-y-2 text-[#8E8E8A]">
                <li><strong className="text-[#F5F3EE]">Klien (React + Tailwind):</strong> Mengendalikan render audio HTML5, visualizer vinyl beranimasi, dan pengiraan offset masa.</li>
                <li><strong className="text-[#F5F3EE]">Pelayan (Express + Socket.IO):</strong> Bertindak sebagai sumber kebenaran (Source of Truth) untuk bilik, giliran lagu (queue), dan status mainan.</li>
                <li><strong className="text-[#F5F3EE]">Jamendo API:</strong> Membekalkan ribuan fail audio Creative Commons berlesen penuh secara percuma dan legal.</li>
              </ul>
            </div>
          )}

          {activeDoc === 'roadmap' && (
            <div className="space-y-4">
              <h4 className="text-base font-normal text-[#F5F3EE] font-editorial">Pelan Pembangunan PoySic</h4>
              <div className="space-y-3">
                <div className="border-l-2 border-[#FF4D2E] pl-3">
                  <span className="text-[#FF4D2E] font-bold text-xs uppercase font-mono">Fasa 1: MVP (Telah Siap)</span>
                  <p className="text-[#8E8E8A] text-xs">Penyegerakan jam Cristian, audio drift correction, carian Jamendo CC, queue, sembang & reaksi emoji.</p>
                </div>
                <div className="border-l-2 border-[#333333] pl-3">
                  <span className="text-[#A0A09C] font-bold text-xs uppercase font-mono">Fasa 2: Polish & Visualizer</span>
                  <p className="text-[#8E8E8A] text-xs">Penyegerakan lirik lagu serentak, mod dwi-hos, penjimatan audio cache IndexedDB.</p>
                </div>
                <div className="border-l-2 border-[#333333] pl-3">
                  <span className="text-[#A0A09C] font-bold text-xs uppercase font-mono">Fasa 3: Komuniti & Kelestarian</span>
                  <p className="text-[#8E8E8A] text-xs">Sumbangan komuniti Saweria, sokongan aplikasi PWA mudah alih, dan bilik peribadi berkunci kata laluan.</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Modal */}
        <div className="p-4 border-t border-[#222222] bg-[#0A0A0A] flex justify-end">
          <button
            onClick={onClose}
            aria-label="Tutup dokumentasi"
            className="px-4 py-2 bg-[#FF4D2E] hover:bg-[#ff6145] text-[#0A0A0A] font-bold rounded-none text-xs font-mono transition"
          >
            TUTUP
          </button>
        </div>
      </div>
    </div>
  );
};
