/**
 * TruWell AI — NVIDIA NIM cloud TTS (parallel to existing useSpeechPlayer)
 */

import { invokeNimTtsHealth, invokeNimTtsSynthesize } from '@/lib/edge';
import { setAudioModeAsync, useAudioPlayer } from 'expo-audio';
import { useCallback, useEffect, useRef, useState } from 'react';
import { NIM_DEFAULT_LANGUAGE, NIM_DEFAULT_VOICE, NIM_TTS_CONFIG, NIM_VOICES } from '../constants';
import type { NIMTTSVoice, TTSLanguageCode, NIMTTSStatus } from '../types';
import { base64ToUri, releaseUri, sanitizeForSpeech, splitIntoChunks } from '../utils/audioUtils';

function useLatest<T>(value: T) {
  const r = useRef(value);
  r.current = value;
  return r;
}

export function useNIMTTS() {
  const player = useAudioPlayer(null);

  const [status, setStatus] = useState<NIMTTSStatus>('idle');
  const [currentMessageId, setCurrentMessageId] = useState<string | null>(null);
  const [durationMs, setDurationMs] = useState(0);
  const [progressMs, setProgressMs] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [selectedVoice, setSelectedVoice] = useState<NIMTTSVoice>(NIM_DEFAULT_VOICE);
  const [selectedLanguage, setSelectedLanguage] = useState<TTSLanguageCode>(NIM_DEFAULT_LANGUAGE);
  const [isNIMAvailable, setIsNIMAvailable] = useState(false);

  const genRef = useRef(0);
  const statusRef = useRef<NIMTTSStatus>('idle');
  const currentMessageIdRef = useRef<string | null>(null);
  const pausedRef = useRef(false);
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const playbackPollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const idleResetRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fileUriRef = useRef<string | null>(null);
  const chunkBaseOffsetMsRef = useRef(0);
  const targetDurationMsRef = useRef(0);
  const selectedVoiceRef = useLatest(selectedVoice);
  const selectedLanguageRef = useLatest(selectedLanguage);

  useEffect(() => {
    statusRef.current = status;
  }, [status]);
  useEffect(() => {
    currentMessageIdRef.current = currentMessageId;
  }, [currentMessageId]);

  const clearProgressTicker = useCallback(() => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
  }, []);

  const clearPlaybackPoll = useCallback(() => {
    if (playbackPollRef.current) {
      clearInterval(playbackPollRef.current);
      playbackPollRef.current = null;
    }
  }, []);

  const clearIdleReset = useCallback(() => {
    if (idleResetRef.current) {
      clearTimeout(idleResetRef.current);
      idleResetRef.current = null;
    }
  }, []);

  const bumpGen = useCallback(() => {
    genRef.current += 1;
  }, []);

  const stopInner = useCallback(() => {
    bumpGen();
    clearProgressTicker();
    clearPlaybackPoll();
    clearIdleReset();
    pausedRef.current = false;

    try {
      player.pause();
      void Promise.resolve(player.seekTo(0)).catch(() => { /* noop */ });
    } catch {
      /* noop */
    }

    const uri = fileUriRef.current;
    fileUriRef.current = null;
    if (uri) void releaseUri(uri);

    setCurrentMessageId(null);
    setDurationMs(0);
    setProgressMs(0);
    setStatus('idle');
    setError(null);

    chunkBaseOffsetMsRef.current = 0;
    targetDurationMsRef.current = 0;
  }, [bumpGen, clearPlaybackPoll, clearProgressTicker, clearIdleReset, player]);

  const scheduleIdleAfterError = useCallback(() => {
    clearIdleReset();
    idleResetRef.current = setTimeout(() => {
      stopInner();
      idleResetRef.current = null;
    }, 3000);
  }, [clearIdleReset, stopInner]);

  /** Progress ticker — reads expo-audio player fields directly */
  const startProgressTicker = useCallback(() => {
    clearProgressTicker();
    progressIntervalRef.current = setInterval(() => {
      const base = chunkBaseOffsetMsRef.current;
      try {
        const sec = player.currentTime;
        const cur = Math.min(
          Math.floor(base + sec * 1000),
          targetDurationMsRef.current > 0 ? targetDurationMsRef.current : Infinity,
        );
        setProgressMs(cur);
      } catch {
        /* noop */
      }
    }, 80);
  }, [clearProgressTicker, player]);

  /** Wait until playback position reaches duration or operation cancelled */
  const waitPlaybackEnd = useCallback(
    (cookie: number): Promise<void> =>
      new Promise((resolve) => {
        clearPlaybackPoll();
        playbackPollRef.current = setInterval(() => {
          if (cookie !== genRef.current) {
            clearPlaybackPoll();
            resolve();
            return;
          }
          if (pausedRef.current) return;
          try {
            if (!player.isLoaded || player.duration <= 0) return;
            const ended =
              !player.playing && player.currentTime >= player.duration - 0.15;
            if (ended) {
              clearPlaybackPoll();
              resolve();
            }
          } catch {
            clearPlaybackPoll();
            resolve();
          }
        }, 55);
      }),
    [clearPlaybackPoll, player],
  );

  useEffect(() => {
    setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: false,
      allowsRecording: false,
      interruptionMode: 'duckOthers',
      interruptionModeAndroid: 'duckOthers',
    }).catch(() => { /* noop */ });
  }, []);

  const checkHealth = useCallback(async () => {
    try {
      const h = await invokeNimTtsHealth();
      setIsNIMAvailable(!!h.ready);
    } catch {
      setIsNIMAvailable(false);
    }
  }, []);

  useEffect(() => {
    void checkHealth();
    const iv = setInterval(() => {
      void checkHealth();
    }, NIM_TTS_CONFIG.healthCheckIntervalMs);
    return () => clearInterval(iv);
  }, [checkHealth]);

  useEffect(() => {
    return () => {
      stopInner();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- unmount teardown only
  }, []);

  const pause = useCallback(() => {
    if (statusRef.current !== 'playing') return;
    pausedRef.current = true;
    clearProgressTicker();
    try {
      player.pause();
    } catch {
      /* noop */
    }
    setStatus('paused');
  }, [clearProgressTicker, player]);

  const resume = useCallback(() => {
    if (statusRef.current !== 'paused') return;
    pausedRef.current = false;
    try {
      player.play();
    } catch {
      /* noop */
    }
    startProgressTicker();
    setStatus('playing');
  }, [player, startProgressTicker]);

  const stop = useCallback(() => {
    stopInner();
  }, [stopInner]);

  const speak = useCallback(
    async (text: string, messageId: string) => {
      if (!isNIMAvailable) return;

      if (
        statusRef.current === 'paused' &&
        currentMessageIdRef.current === messageId
      ) {
        resume();
        return;
      }

      if (
        statusRef.current === 'playing' &&
        currentMessageIdRef.current === messageId
      ) {
        stop();
        return;
      }

      stopInner();

      const cookie = genRef.current;
      clearIdleReset();
      setStatus('loading');
      setCurrentMessageId(messageId);
      setDurationMs(0);
      setProgressMs(0);
      setError(null);

      const cleaned = sanitizeForSpeech(text ?? '');
      if (!cleaned) {
        setStatus('idle');
        setCurrentMessageId(null);
        return;
      }

      const chunks = splitIntoChunks(cleaned, NIM_TTS_CONFIG.maxCharsPerRequest);
      let playedPrefixMs = 0;

      try {
        for (let i = 0; i < chunks.length; i++) {
          if (cookie !== genRef.current) return;

          const chunk = chunks[i];
          const synth = await invokeNimTtsSynthesize({
            text: chunk,
            voice: selectedVoiceRef.current.name,
            languageCode: selectedLanguageRef.current,
          });

          if (cookie !== genRef.current) return;

          const projectedTotal = playedPrefixMs + synth.durationMs;
          targetDurationMsRef.current = projectedTotal;
          setDurationMs(projectedTotal);

          if (fileUriRef.current) {
            await releaseUri(fileUriRef.current);
            fileUriRef.current = null;
          }

          const uri = await base64ToUri(synth.audioContent, 'wav');
          fileUriRef.current = uri;

          chunkBaseOffsetMsRef.current = playedPrefixMs;
          setProgressMs(playedPrefixMs);

          player.replace(uri);
          player.volume = 1;
          pausedRef.current = false;
          try {
            player.play();
          } catch {
            throw new Error('Unable to play NIM audio');
          }

          await new Promise<void>((r) => {
            setTimeout(r, 100);
          });

          setStatus('playing');
          startProgressTicker();

          const fuseMs = Math.max((synth.durationMs || 0) + 5000, 8000);
          await Promise.race([
            waitPlaybackEnd(cookie),
            new Promise<void>((resolve) => {
              setTimeout(() => resolve(), fuseMs);
            }),
          ]);
          clearPlaybackPoll();
          clearProgressTicker();

          if (cookie !== genRef.current) return;

          playedPrefixMs += synth.durationMs;
          chunkBaseOffsetMsRef.current = playedPrefixMs;
          setProgressMs(playedPrefixMs);
        }

        if (cookie !== genRef.current) return;

        setStatus('idle');
        setCurrentMessageId(null);
        setDurationMs(0);
        setProgressMs(0);
        if (fileUriRef.current) {
          await releaseUri(fileUriRef.current);
          fileUriRef.current = null;
        }
        try {
          player.pause();
          void Promise.resolve(player.seekTo(0)).catch(() => { /* noop */ });
        } catch {
          /* noop */
        }
      } catch (e) {
        if (cookie !== genRef.current) return;
        setStatus('error');
        setError(e instanceof Error ? e.message : 'Voice is temporarily unavailable');
        clearProgressTicker();
        clearPlaybackPoll();
        if (fileUriRef.current) {
          await releaseUri(fileUriRef.current);
          fileUriRef.current = null;
        }
        scheduleIdleAfterError();
      }
    },
    [
      isNIMAvailable,
      resume,
      stop,
      stopInner,
      clearIdleReset,
      player,
      waitPlaybackEnd,
      startProgressTicker,
      clearProgressTicker,
      clearPlaybackPoll,
      scheduleIdleAfterError,
      selectedVoiceRef,
      selectedLanguageRef,
    ],
  );

  const setVoice = useCallback(
    (voice: NIMTTSVoice) => {
      stopInner();
      setSelectedVoice(voice);
      setSelectedLanguage(voice.languageCode);
    },
    [stopInner],
  );

  return {
    status,
    currentMessageId,
    durationMs,
    progressMs,
    error,
    selectedVoice,
    selectedLanguage,
    speak,
    pause,
    resume,
    stop,
    setVoice,
    isNIMAvailable,
    availableVoices: [...NIM_VOICES],
  };
}
