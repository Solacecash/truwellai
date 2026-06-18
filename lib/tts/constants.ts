import type { TTSLanguageCode, NIMTTSVoice } from './types';

export const NIM_VOICES: readonly NIMTTSVoice[] = [
  {
    name: 'Magpie-Multilingual.EN-US.Aria',
    languageCode: 'en-US',
    displayName: 'Aria',
    gender: 'female',
  },
  {
    name: 'Magpie-Multilingual.EN-US.Ryan',
    languageCode: 'en-US',
    displayName: 'Ryan',
    gender: 'male',
  },
  {
    name: 'Magpie-Multilingual.ES-US.Diego',
    languageCode: 'es-US',
    displayName: 'Diego',
    gender: 'male',
  },
  {
    name: 'Magpie-Multilingual.FR-FR.Louise',
    languageCode: 'fr-FR',
    displayName: 'Louise',
    gender: 'female',
  },
  {
    name: 'Magpie-Multilingual.DE-DE.Klaus',
    languageCode: 'de-DE',
    displayName: 'Klaus',
    gender: 'male',
  },
] as const;

export const NIM_DEFAULT_VOICE: NIMTTSVoice = NIM_VOICES[0];

/** Default language aligns with DEFAULT_VOICE unless changed by voice picker state. */
export const NIM_DEFAULT_LANGUAGE: TTSLanguageCode = NIM_VOICES[0].languageCode;

export const NIM_TTS_CONFIG = {
  maxCharsPerRequest: 500,
  sampleRateHz: 22050,
  healthCheckIntervalMs: 60000,
  synthesisTimeoutMs: 30000,
} as const;

export const NIM_TTS_COLORS = {
  teal: '#00E5C8',
  gold: '#C9A84C',
  navy: '#081422',
  error: '#FF4757',
} as const;
