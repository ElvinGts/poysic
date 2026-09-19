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
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-fadeIn">
        {/* Header Modal */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-white text-base">Dokumentasi PoySic</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Pilihan Dokumen */}
        <div className="flex items-center gap-2 px-5 pt-3 border-b border-slate-800/80 bg-slate-950/40">
          <button
            onClick={() => setActiveDoc('sync')}
            className={`flex items-center gap-1.5 pb-3 px-2 text-xs font-semibold border-b-2 transition ${
              activeDoc === 'sync'
                ? 'border-emerald-400 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>Enjin Sync & Drift</span>
          </button>

          <button
            onClick={() => setActiveDoc('architecture')}
            className={`flex items-center gap-1.5 pb-3 px-2 text-xs font-semibold border-b-2 transition ${
              activeDoc === 'architecture'
                ? 'border-emerald-400 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Seni Bina (Architecture)</span>
          </button>

          <button
            onClick={() => setActiveDoc('roadmap')}
            className={`flex items-center gap-1.5 pb-3 px-2 text-xs font-semibold border-b-2 transition ${
              activeDoc === 'roadmap'
                ? 'border-emerald-400 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Pelan Tindakan (Roadmap)</span>
          </button>
        </div>

        {/* Kandungan Dokumen */}
        <div className="p-5 sm:p-6 overflow-y-auto text-xs sm:text-sm text-slate-300 space-y-4 leading-relaxed">
          {activeDoc === 'sync' && (
            <div className="space-y-4">
              <h4 className="text-base font-bold text-white">Cara Enjin Sinkronisasi PoySic Berfungsi</h4>
              <p>
                PoySic menggunakan gabungan <strong>Algoritma Cristian</strong> dan <strong>Drift Correction Threshold</strong> untuk memastikan audio bermain serentak antara pasangan atau rakan yang berjauhan:
              </p>

              <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl font-mono text-xs text-emerald-400 space-y-1">
                <div>// 1. Kira Latensi & Jam Offset (ms)</div>
                <div>RTT = t1 - t0;</div>
                <div>latency = RTT / 2;</div>
                <div>offset = serverTime - (t1 - latency);</div>
                <div>currentServerTime = Date.now() + offset;</div>
              </div>

              <h5 className="font-bold text-white mt-3">Pembetulan Drift (&lt; 0.45 saat)</h5>
              <p>
                Pelayan menghantar denyutan degupan (*heartbeat*) setiap 5 saat. Sekiranya perbezaan antara pemain audio anda dan anggaran masa pelayan melebihi 0.45s (contohnya peranti terkunci atau tab terhad jalur lebar), audio dipaksa melompat (*hard seek*) ke saat yang tepat.
              </p>

              <div className="p-3 bg-emerald-950/20 border border-emerald-500/20 rounded-xl text-emerald-300 text-xs flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 flex-shrink-0 text-emerald-400" />
                <span>Zero Ads bermakna tiada iklan yang akan merosakkan sinkronisasi audio pada saat kritikal.</span>
              </div>
            </div>
          )}

          {activeDoc === 'architecture' && (
            <div className="space-y-4">
              <h4 className="text-base font-bold text-white">Seni Bina Aliran Data PoySic</h4>
              <p>
                Aplikasi distrukturkan mengikut model klien-pelayan berautoriti:
              </p>
              <ul className="list-disc list-inside space-y-2 text-slate-400">
                <li><strong className="text-slate-200">Klien (React + Tailwind):</strong> Mengendalikan render audio HTML5, visualizer vinyl beranimasi, dan pengiraan offset masa.</li>
                <li><strong className="text-slate-200">Pelayan (Express + Socket.IO):</strong> Bertindak sebagai sumber kebenaran (Source of Truth) untuk bilik, giliran lagu (queue), dan status mainan.</li>
                <li><strong className="text-slate-200">Jamendo API:</strong> Membekalkan ribuan fail audio Creative Commons berlesen penuh secara percuma dan legal.</li>
              </ul>
            </div>
          )}

          {activeDoc === 'roadmap' && (
            <div className="space-y-4">
              <h4 className="text-base font-bold text-white">Pelan Pembangunan PoySic</h4>
              <div className="space-y-3">
                <div className="border-l-2 border-emerald-400 pl-3">
                  <span className="text-emerald-400 font-bold text-xs uppercase">Fasa 1: MVP (Telah Siap)</span>
                  <p className="text-slate-400 text-xs">Penyegerakan jam Cristian, audio drift correction, carian Jamendo CC, queue, sembang & reaksi emoji.</p>
                </div>
                <div className="border-l-2 border-slate-700 pl-3">
                  <span className="text-slate-300 font-bold text-xs uppercase">Fasa 2: Polish & Visualizer</span>
                  <p className="text-slate-400 text-xs">Penyegerakan lirik lagu serentak, mod dwi-hos, penjimatan audio cache IndexedDB.</p>
                </div>
                <div className="border-l-2 border-slate-700 pl-3">
                  <span className="text-slate-300 font-bold text-xs uppercase">Fasa 3: Komuniti & Kelestarian</span>
                  <p className="text-slate-400 text-xs">Sumbangan komuniti Saweria, sokongan aplikasi PWA mudah alih, dan bilik peribadi berkunci kata laluan.</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Modal */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold rounded-xl text-xs transition"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
