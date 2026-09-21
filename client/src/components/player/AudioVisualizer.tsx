/**
 * client/src/components/player/AudioVisualizer.tsx
 * Tujuan: Visualizer audio berasaskan HTML5 Canvas yang tersinkron masa nyata dengan mainan muzik PoySic.
 * Ciri:
 * - Mod Waveform (Oscilloscope Analog), EQ Bars (36-Jalur Spektrum), dan Radial Grooves (Piring Vinyl).
 * - Berhubung terus dengan Web Audio API AnalyserNode dengan fallback simulasi akustik berasaskan detik lagu.
 * - Reka bentuk editorial tajam (sharp edges, 0-2px border), palet #FF4D2E & #A8E6CF, tipografi IBM Plex Mono.
 */
import React, { useRef, useEffect, useState } from 'react';
import { SyncedAudio } from '../../lib/audio';

export type VisualizerMode = 'waveform' | 'bars' | 'radial';

interface AudioVisualizerProps {
  syncedAudio: SyncedAudio | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  trackGenre?: string;
  className?: string;
}

export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({
  syncedAudio,
  isPlaying,
  currentTime,
  duration,
  volume,
  isMuted,
  trackGenre,
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const [mode, setMode] = useState<VisualizerMode>('waveform');

  // Peak buffer untuk mod EQ bars (meniru paparan perkakasan Hi-Fi vintaj)
  const peakValuesRef = useRef<number[]>(new Array(36).fill(0));
  const peakDecayRef = useRef<number[]>(new Array(36).fill(0));
  const phaseRef = useRef<number>(0);

  // Rujukan prop sentiasa terkini tanpa mencetuskan pusingan pembatalan/pembinaan semula RAF
  const propsRef = useRef({
    syncedAudio,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    mode,
  });

  useEffect(() => {
    propsRef.current = {
      syncedAudio,
      isPlaying,
      currentTime,
      duration,
      volume,
      isMuted,
      mode,
    };
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Buffer audio data
    const freqData = new Uint8Array(128);
    const timeData = new Uint8Array(128);
    let lastRenderTime = 0;

    const render = (now: number) => {
      const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
      // Jika pengguna memilih reduced motion, hadkan kepada kemaskini tenang (1 fps) untuk mengelakkan pening/vestibular strain
      if (prefersReducedMotion && now - lastRenderTime < 1000) {
        animationFrameRef.current = requestAnimationFrame(render);
        return;
      }
      lastRenderTime = now;

      const {
        syncedAudio: audio,
        isPlaying: activePlaying,
        currentTime: curTime,
        duration: totalDur,
        volume: curVol,
        isMuted: curMuted,
        mode: curMode,
      } = propsRef.current;

      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const width = canvas.width / dpr;
      const height = canvas.height / dpr;
      if (width <= 0 || height <= 0) {
        animationFrameRef.current = requestAnimationFrame(render);
        return;
      }

      ctx.save();
      ctx.scale(dpr, dpr);

      // 1. Dapatkan data audio sebenar atau jana simulasi tersinkron
      let hasRealData = false;
      if (audio && activePlaying && !curMuted && curVol > 0) {
        hasRealData = audio.getAudioData(freqData, timeData);
      }

      const effectiveVol = curMuted ? 0 : curVol;
      const phase = phaseRef.current;

      if (!hasRealData) {
        // Simulasi parametrik yang bersandar pada detik lagu (currentTime) dan kelantangan
        const tempo = 1.9; // ~114 BPM
        const beat = Math.sin(curTime * Math.PI * tempo);
        const subBeat = Math.cos(curTime * Math.PI * 0.95);
        const energyMultiplier = activePlaying ? effectiveVol : 0.06;

        for (let i = 0; i < 128; i++) {
          const freqNorm = i / 128;
          // Gelombang frekuensi rendah (bass) berdenyut lebih kuat
          const bassPulse = Math.max(0, beat) * Math.exp(-freqNorm * 4) * 80;
          const harmonic = Math.sin(phase * 0.08 + i * 0.22) * 28 + Math.cos(phase * 0.04 + i * 0.1) * 18;
          const noise = (Math.sin(phase * 0.3 + i * 1.5) + 1) * 6;

          const synthesizedVal = Math.min(
            255,
            Math.max(0, (40 + bassPulse + harmonic + noise) * energyMultiplier)
          );
          freqData[i] = synthesizedVal;

          // Time domain (gelombang sinusoidal oscilloscope)
          const timeWave = Math.sin(phase * 0.07 + (i / 128) * Math.PI * 6 + subBeat * 0.5);
          timeData[i] = activePlaying
            ? Math.floor(128 + timeWave * 48 * energyMultiplier)
            : 128 + Math.sin(phase * 0.02 + (i / 128) * Math.PI * 2) * 4;
        }
      }

      // Bersihkan latar belakang matte gelap
      ctx.fillStyle = '#0A0A0A';
      ctx.fillRect(0, 0, width, height);

      // Garisan grid perkakasan audio analog (hairline graticule)
      ctx.strokeStyle = '#181818';
      ctx.lineWidth = 1;

      // Garisan grid mendatar
      const gridYSteps = 4;
      for (let g = 1; g < gridYSteps; g++) {
        const y = (height / gridYSteps) * g;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Garisan grid menegak
      const gridXSteps = 6;
      for (let g = 1; g < gridXSteps; g++) {
        const x = (width / gridXSteps) * g;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }

      // 2. Lukis berdasarkan mod pilihan
      if (curMode === 'waveform') {
        // --- MOD OSCILLOSCOPE ANALOG ---
        const centerY = height / 2;

        // Garisan sifar tengah (centerline)
        ctx.strokeStyle = '#222222';
        ctx.beginPath();
        ctx.moveTo(0, centerY);
        ctx.lineTo(width, centerY);
        ctx.stroke();

        // Gelombang audio utama (#FF4D2E)
        ctx.beginPath();
        ctx.lineWidth = 2;
        ctx.strokeStyle = activePlaying ? '#FF4D2E' : '#525252';
        ctx.shadowColor = activePlaying ? '#FF4D2E' : 'transparent';
        ctx.shadowBlur = activePlaying ? 8 : 0;

        const sliceWidth = width / 128;
        let x = 0;

        for (let i = 0; i < 128; i++) {
          const v = timeData[i] / 128.0; // 0.0 - 2.0
          const y = (v * centerY);

          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            // Bezier curve licin
            const prevX = x - sliceWidth;
            const prevV = timeData[i - 1] / 128.0;
            const prevY = prevV * centerY;
            const midX = (prevX + x) / 2;
            ctx.quadraticCurveTo(prevX, prevY, midX, (prevY + y) / 2);
          }
          x += sliceWidth;
        }
        ctx.lineTo(width, centerY);
        ctx.stroke();

        // Salinan kedua subtle untuk kedalaman visual (stereo phase flare)
        if (activePlaying) {
          ctx.beginPath();
          ctx.lineWidth = 1;
          ctx.strokeStyle = 'rgba(168, 230, 207, 0.45)'; // Mint sync
          ctx.shadowBlur = 0;
          x = 0;
          for (let i = 0; i < 128; i++) {
            const v = (timeData[127 - i] / 128.0) * 0.7 + 0.15;
            const y = v * centerY;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
            x += sliceWidth;
          }
          ctx.stroke();
        }
      } else if (curMode === 'bars') {
        // --- MOD EQ BARS (SPEKTRUM 36 JALUR DENGAN PEAK METER) ---
        const barCount = 36;
        const barGap = 3;
        const totalGap = barGap * (barCount - 1);
        const barWidth = Math.max(2, (width - totalGap) / barCount);
        const peaks = peakValuesRef.current;
        const decays = peakDecayRef.current;

        for (let i = 0; i < barCount; i++) {
          // Petakan indeks bar ke rentang frekuensi audio
          const freqIndex = Math.min(127, Math.floor(Math.pow(i / barCount, 1.4) * 90));
          const rawEnergy = freqData[freqIndex] || 0;
          const normalized = rawEnergy / 255;
          const barHeight = Math.max(3, normalized * (height - 18));

          // Kemaskini peak meter
          if (barHeight > peaks[i]) {
            peaks[i] = barHeight;
            decays[i] = 0;
          } else {
            decays[i] = (decays[i] || 0) + 0.35;
            peaks[i] = Math.max(3, peaks[i] - decays[i]);
          }

          const x = i * (barWidth + barGap);
          const y = height - barHeight;

          // Gradien menegak perkakasan: dari gelap ke #FF4D2E
          const grad = ctx.createLinearGradient(0, height, 0, y);
          grad.addColorStop(0, '#1A1A1A');
          grad.addColorStop(0.4, '#802616');
          grad.addColorStop(1, activePlaying ? '#FF4D2E' : '#525252');

          ctx.fillStyle = grad;
          ctx.fillRect(x, y, barWidth, barHeight);

          // Garisan penanda puncak (peak cap indicator)
          const peakY = height - peaks[i] - 2;
          ctx.fillStyle = activePlaying ? '#A8E6CF' : '#333333';
          ctx.fillRect(x, Math.max(1, peakY), barWidth, 2);
        }
      } else if (curMode === 'radial') {
        // --- MOD RADIAL GROOVES (ALUR PIRING VINYL) ---
        const cx = width / 2;
        const cy = height / 2;
        const maxRadius = Math.min(cx, cy) - 10;
        const rings = 8;

        for (let r = 0; r < rings; r++) {
          const ringProgress = (r + 1) / rings;
          const radius = ringProgress * maxRadius;
          const freqIdx = Math.floor(ringProgress * 48);
          const energy = (freqData[freqIdx] || 0) / 255;

          ctx.beginPath();
          ctx.arc(cx, cy, Math.max(4, radius + energy * 9), 0, Math.PI * 2);
          ctx.lineWidth = r === rings - 1 ? 2 : 1;

          if (r === rings - 1) {
            ctx.strokeStyle = activePlaying ? '#FF4D2E' : '#333333';
            ctx.shadowColor = activePlaying ? '#FF4D2E' : 'transparent';
            ctx.shadowBlur = activePlaying ? 6 : 0;
          } else {
            ctx.strokeStyle = `rgba(168, 230, 207, ${0.12 + energy * 0.4})`;
            ctx.shadowBlur = 0;
          }
          ctx.stroke();
        }

        // Titik pusat spindle
        ctx.fillStyle = activePlaying ? '#FF4D2E' : '#333333';
        ctx.beginPath();
        ctx.arc(cx, cy, 3, 0, Math.PI * 2);
        ctx.fill();
      }

      // Reset bayang
      ctx.shadowBlur = 0;

      // Meter teks HUD sudut bawah: frekuensi sampel & format mono
      ctx.font = '9px "IBM Plex Mono", monospace';
      ctx.fillStyle = '#666666';
      ctx.fillText(
        activePlaying ? 'REALTIME DSP • 44.1kHz • 256-FFT' : 'DSP STANDBY • PAUSED',
        8,
        height - 6
      );

      ctx.textAlign = 'right';
      ctx.fillText(
        `${curTime.toFixed(1)}s / ${(totalDur || 180).toFixed(0)}s`,
        width - 8,
        height - 6
      );
      ctx.textAlign = 'left';

      ctx.restore();

      phaseRef.current += 1;
      animationFrameRef.current = requestAnimationFrame(render);
    };

    // Sambungkan ResizeObserver untuk saiz resolusi tepat (tanpa blur retina)
    const handleResize = () => {
      if (!container || !canvas) return;
      const rect = container.getBoundingClientRect();
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const w = Math.max(10, Math.floor(rect.width));
      const h = Math.max(10, Math.floor(rect.height || 180));
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
    };

    handleResize();
    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    animationFrameRef.current = requestAnimationFrame(render);

    return () => {
      resizeObserver.disconnect();
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={`w-full relative bg-[#0A0A0A] border border-[#222222] overflow-hidden ${className}`}
    >
      {/* Header Visualizer dengan Pemilih Mod & Penunjuk Akustik */}
      <div className="absolute top-2 left-2.5 right-2.5 z-10 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-2 pointer-events-auto">
          <span className="text-[10px] font-mono tracking-wider uppercase text-[#888884] flex items-center gap-1.5">
            <span
              className={`inline-block w-1.5 h-1.5 ${
                isPlaying ? 'bg-[#FF4D2E] animate-pulse' : 'bg-[#444444]'
              }`}
            />
            OSCILLOSCOPE
          </span>
          {trackGenre && (
            <span className="hidden sm:inline-block text-[9px] font-mono px-1.5 py-0.5 bg-[#171717] text-[#A8E6CF] border border-[#262626]">
              {trackGenre}
            </span>
          )}
        </div>

        {/* Butang Pemilih Mod: WAVE, EQ, VINYL */}
        <div className="flex items-center gap-1 pointer-events-auto bg-[#121212] border border-[#262626] p-0.5">
          <button
            type="button"
            onClick={() => setMode('waveform')}
            title="Tunjuk gelombang audio analog"
            aria-label="Mod gelombang audio analog"
            className={`min-h-[44px] min-w-[44px] px-3 py-1 text-[11px] font-mono transition-colors flex items-center justify-center ${
              mode === 'waveform'
                ? 'bg-[#FF4D2E] text-[#0A0A0A] font-bold'
                : 'text-[#8E8E8A] hover:text-[#F5F3EE]'
            }`}
          >
            WAVE
          </button>
          <button
            type="button"
            onClick={() => setMode('bars')}
            title="Tunjuk equalizer spektrum jalur 36"
            aria-label="Mod equalizer spektrum jalur 36"
            className={`min-h-[44px] min-w-[44px] px-3 py-1 text-[11px] font-mono transition-colors flex items-center justify-center ${
              mode === 'bars'
                ? 'bg-[#FF4D2E] text-[#0A0A0A] font-bold'
                : 'text-[#8E8E8A] hover:text-[#F5F3EE]'
            }`}
          >
            EQ
          </button>
          <button
            type="button"
            onClick={() => setMode('radial')}
            title="Tunjuk alur radial piring vinyl"
            aria-label="Mod alur radial piring vinyl"
            className={`min-h-[44px] min-w-[44px] px-3 py-1 text-[11px] font-mono transition-colors flex items-center justify-center ${
              mode === 'radial'
                ? 'bg-[#FF4D2E] text-[#0A0A0A] font-bold'
                : 'text-[#8E8E8A] hover:text-[#F5F3EE]'
            }`}
          >
            RADIAL
          </button>
        </div>
      </div>

      {/* HTML5 Canvas */}
      <canvas
        ref={canvasRef}
        className="block w-full h-full cursor-crosshair"
      />
    </div>
  );
};
