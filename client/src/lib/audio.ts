/**
 * client/src/lib/audio.ts
 * Tujuan: Wrapper HTML5 Audio dengan drift correction masa nyata untuk mainan tersinkron PoySic.
 * Ciri:
 * - HTML5 Audio core dengan crossOrigin = 'anonymous' dan preload = 'auto'.
 * - Integrasi Web Audio API AnalyserNode untuk visualizer.
 * - Drift threshold 0.45s (450ms) dengan hard-seek jika melebihi ambang.
 * - Pengendalian sekatan dasar autoplay pelayar.
 */
import { AudioStateCallback, AutoplayBlockedCallback } from '../types';

export class SyncedAudio {
  public audioElement: HTMLAudioElement;
  private driftThreshold: number = 0.45; // pembetulan automatik jika drift > 0.45 saat
  private stateCallbacks: Set<AudioStateCallback> = new Set();
  private autoplayBlockedCallbacks: Set<AutoplayBlockedCallback> = new Set();
  private lastReportedDrift: number = 0;
  private audioCtx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private sourceNode: MediaElementAudioSourceNode | null = null;
  private hasConnectedMediaSource: boolean = false;
  private isAutoplayBlocked: boolean = false;

  constructor(src: string = '') {
    this.audioElement = new Audio(src);
    this.audioElement.preload = 'auto';
    this.audioElement.crossOrigin = 'anonymous';

    this.audioElement.addEventListener('timeupdate', () => {
      this.notifyState();
    });

    this.audioElement.addEventListener('play', () => {
      this.ensureAudioContext();
      this.notifyAutoplayBlocked(false);
      this.notifyState();
    });

    this.audioElement.addEventListener('pause', () => {
      this.notifyState();
    });

    this.audioElement.addEventListener('loadedmetadata', () => {
      this.notifyState();
    });

    this.audioElement.addEventListener('error', (e) => {
      console.warn('[SyncedAudio] Audio element error:', e);
      this.notifyState();
    });
  }

  /**
   * Mengaktifkan AudioContext dan AnalyserNode untuk visualisasi audio canvas masa nyata.
   */
  public ensureAudioContext(): AnalyserNode | null {
    if (this.analyser) {
      if (this.audioCtx && this.audioCtx.state === 'suspended') {
        this.audioCtx.resume().catch(() => {});
      }
      return this.analyser;
    }

    if (this.hasConnectedMediaSource) {
      return this.analyser;
    }

    try {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtxClass) return null;

      this.audioCtx = new AudioCtxClass();
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume().catch(() => {});
      }

      this.sourceNode = this.audioCtx.createMediaElementSource(this.audioElement);
      this.hasConnectedMediaSource = true;
      this.analyser = this.audioCtx.createAnalyser();
      this.analyser.fftSize = 256;
      this.analyser.smoothingTimeConstant = 0.82;
      this.sourceNode.connect(this.analyser);
      this.analyser.connect(this.audioCtx.destination);
      return this.analyser;
    } catch (err) {
      console.warn('[SyncedAudio] Web Audio Analyser fallback:', err);
      return null;
    }
  }

  public getAnalyser(): AnalyserNode | null {
    return this.analyser || this.ensureAudioContext();
  }

  public getAudioElement(): HTMLAudioElement {
    return this.audioElement;
  }

  /**
   * Mengambil data frekuensi dan masa semasa untuk visualizer canvas.
   * Mengembalikan true jika data daripada analyser aktif, atau false jika perlu simulasi matematik.
   */
  public getAudioData(frequencyData: Uint8Array, timeData: Uint8Array): boolean {
    if (!this.analyser) {
      this.ensureAudioContext();
    }

    if (this.analyser && !this.audioElement.paused) {
      try {
        (this.analyser.getByteFrequencyData as (arr: Uint8Array) => void)(frequencyData);
        (this.analyser.getByteTimeDomainData as (arr: Uint8Array) => void)(timeData);
        let energy = 0;
        for (let i = 0; i < 32; i++) {
          energy += frequencyData[i];
        }
        if (energy > 0) return true;
      } catch {
        // Abaikan jika ada sekatan pelayar
      }
    }
    return false;
  }

  public play(): Promise<void> {
    this.ensureAudioContext();
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }

    const playPromise = this.audioElement.play();
    if (playPromise !== undefined) {
      return playPromise
        .then(() => {
          this.notifyAutoplayBlocked(false);
        })
        .catch((error: Error) => {
          if (error.name === 'NotAllowedError') {
            console.warn('[SyncedAudio] Autoplay blocked by browser policy:', error.message);
            this.notifyAutoplayBlocked(true);
          } else {
            console.warn('[SyncedAudio] Audio playback error:', error.message);
          }
        });
    }
    return Promise.resolve();
  }

  public notifyAutoplayBlocked(blocked: boolean): void {
    if (this.isAutoplayBlocked !== blocked) {
      this.isAutoplayBlocked = blocked;
      this.autoplayBlockedCallbacks.forEach((cb) => cb(blocked));
    }
  }

  public onAutoplayBlocked(callback: AutoplayBlockedCallback): () => void {
    this.autoplayBlockedCallbacks.add(callback);
    callback(this.isAutoplayBlocked);
    return () => {
      this.autoplayBlockedCallbacks.delete(callback);
    };
  }

  public pause(): void {
    this.audioElement.pause();
  }

  public seek(time: number): void {
    if (Number.isFinite(time) && time >= 0) {
      this.audioElement.currentTime = time;
      this.notifyState();
    }
  }

  public setVolume(volume: number): void {
    const clamped = Math.max(0, Math.min(1, volume));
    this.audioElement.volume = clamped;
  }

  public getVolume(): number {
    return this.audioElement.volume;
  }

  public setMuted(muted: boolean): void {
    this.audioElement.muted = muted;
  }

  public isMuted(): boolean {
    return this.audioElement.muted;
  }

  public getCurrentTime(): number {
    return this.audioElement.currentTime;
  }

  public getDuration(): number {
    return this.audioElement.duration || 0;
  }

  public isPaused(): boolean {
    return this.audioElement.paused;
  }

  public getLastDrift(): number {
    return this.lastReportedDrift;
  }

  /**
   * Mengira kelewatan rangkaian dan membetulkan kedudukan audio jika melebihi drift threshold (0.45s).
   */
  public syncWith(serverTimePosition: number, serverTimestamp: number, currentServerTime: number): number {
    if (!this.audioElement.src || this.audioElement.src === window.location.href) {
      return 0;
    }

    const networkDelay = Math.max(0, (currentServerTime - serverTimestamp) / 1000);
    const expectedPosition = serverTimePosition + networkDelay;
    const currentPosition = this.audioElement.currentTime;

    const drift = Math.abs(currentPosition - expectedPosition);
    this.lastReportedDrift = drift;

    if (drift > this.driftThreshold) {
      console.log(`[SyncedAudio] Drift corrected: ${drift.toFixed(3)}s (Current: ${currentPosition.toFixed(2)}s -> Expected: ${expectedPosition.toFixed(2)}s)`);
      this.audioElement.currentTime = expectedPosition;
    }

    return drift;
  }

  public setSource(src: string): void {
    if (this.audioElement.src !== src) {
      this.audioElement.src = src;
      this.audioElement.load();
    }
  }

  public onStateChange(callback: AudioStateCallback): () => void {
    this.stateCallbacks.add(callback);
    return () => {
      this.stateCallbacks.delete(callback);
    };
  }

  public onEnded(callback: () => void): () => void {
    const handler = () => callback();
    this.audioElement.addEventListener('ended', handler);
    return () => {
      this.audioElement.removeEventListener('ended', handler);
    };
  }

  private notifyState(): void {
    const data = {
      currentTime: this.audioElement.currentTime,
      duration: this.audioElement.duration || 0,
      isPlaying: !this.audioElement.paused,
      buffered: this.getBufferedAmount(),
    };
    this.stateCallbacks.forEach((cb) => cb(data));
  }

  private getBufferedAmount(): number {
    try {
      if (this.audioElement.buffered.length > 0) {
        return this.audioElement.buffered.end(this.audioElement.buffered.length - 1);
      }
    } catch {
      // ignore
    }
    return 0;
  }

  public destroy(): void {
    this.pause();
    this.audioElement.src = '';
    this.stateCallbacks.clear();
  }
}
