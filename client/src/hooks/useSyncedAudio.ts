/**
 * client/src/hooks/useSyncedAudio.ts
 * Tujuan: Hook tersuai untuk menguruskan kitaran hidup SyncedAudio, kawalan mainan, dan status audio.
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { SyncedAudio } from '../lib/audio';

interface UseSyncedAudioOptions {
  initialSrc?: string;
  initialVolume?: number;
  onEnded?: () => void;
}

export function useSyncedAudio(options: UseSyncedAudioOptions = {}) {
  const { initialSrc = '', initialVolume = 0.85, onEnded } = options;

  const audioRef = useRef<SyncedAudio | null>(null);
  const onEndedRef = useRef<(() => void) | undefined>(onEnded);

  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(185);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [volume, setVolumeState] = useState<number>(initialVolume);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isAutoplayBlocked, setIsAutoplayBlocked] = useState<boolean>(false);

  useEffect(() => {
    onEndedRef.current = onEnded;
  }, [onEnded]);

  useEffect(() => {
    const audio = new SyncedAudio(initialSrc);
    audio.setVolume(initialVolume);
    audioRef.current = audio;

    const unregisterState = audio.onStateChange((state) => {
      setCurrentTime(state.currentTime);
      if (state.duration > 0) {
        setDuration(state.duration);
      }
      setIsPlaying(state.isPlaying);
    });

    const unregisterAutoplay = audio.onAutoplayBlocked((blocked) => {
      setIsAutoplayBlocked(blocked);
    });

    const unregisterEnded = audio.onEnded(() => {
      if (onEndedRef.current) {
        onEndedRef.current();
      }
    });

    return () => {
      unregisterState();
      unregisterAutoplay();
      unregisterEnded();
      audio.destroy();
    };
  }, []);

  const play = useCallback(async () => {
    if (audioRef.current) {
      await audioRef.current.play();
      setIsPlaying(true);
    }
  }, []);

  const pause = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  }, []);

  const seek = useCallback((position: number) => {
    if (audioRef.current) {
      audioRef.current.seek(position);
      setCurrentTime(position);
    }
  }, []);

  const setVolume = useCallback((vol: number) => {
    setVolumeState(vol);
    setIsMuted(vol === 0);
    audioRef.current?.setVolume(vol);
  }, []);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      audioRef.current?.setMuted(next);
      return next;
    });
  }, []);

  const resumeAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.ensureAudioContext();
      audioRef.current.play();
      setIsAutoplayBlocked(false);
      setIsPlaying(true);
    }
  }, []);

  const setSource = useCallback((src: string) => {
    audioRef.current?.setSource(src);
  }, []);

  const syncWith = useCallback((serverPos: number, serverTimestamp: number, currentServerTime: number): number => {
    if (audioRef.current) {
      return audioRef.current.syncWith(serverPos, serverTimestamp, currentServerTime);
    }
    return 0;
  }, []);

  return {
    audioRef,
    currentTime,
    duration,
    isPlaying,
    volume,
    isMuted,
    isAutoplayBlocked,
    setCurrentTime,
    setDuration,
    setIsPlaying,
    play,
    pause,
    seek,
    setVolume,
    toggleMute,
    resumeAudio,
    setSource,
    syncWith,
  };
}
