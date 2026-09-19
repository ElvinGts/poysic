/**
 * client/src/types/audio.ts
 * Tujuan: Definisi callback dan jenis konfigurasi audio untuk PoySic.
 */

export type AudioStateCallback = (data: {
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  buffered: number;
}) => void;

export type AutoplayBlockedCallback = (blocked: boolean) => void;

export type VisualizerMode = 'waveform' | 'bars' | 'radial';
