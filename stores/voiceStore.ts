import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

// ---------------------------------------------------------------------------
// OpenAI TTS voices
// ---------------------------------------------------------------------------
//
// These are the six built-in voices exposed by OpenAI's `tts-1-hd` model.
// They're described in the OpenAI docs as follows (paraphrased for the UI):
//   alloy   — warm, neutral, unisex
//   echo    — soft, articulate male
//   fable   — expressive British male narrator
//   onyx    — deep, grounded male
//   nova    — bright, friendly young female
//   shimmer — soft, calm female
// ---------------------------------------------------------------------------

export type VoiceId = 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer';
export type VoiceGender = 'male' | 'female' | 'neutral';

export interface VoiceOption {
  id: VoiceId;
  label: string;
  gender: VoiceGender;
  description: string;
}

export const VOICE_OPTIONS: VoiceOption[] = [
  { id: 'nova',    label: 'Nova',    gender: 'female',  description: 'Bright and friendly' },
  { id: 'shimmer', label: 'Shimmer', gender: 'female',  description: 'Soft and calm' },
  { id: 'alloy',   label: 'Alloy',   gender: 'neutral', description: 'Warm and balanced' },
  { id: 'echo',    label: 'Echo',    gender: 'male',    description: 'Soft and articulate' },
  { id: 'fable',   label: 'Fable',   gender: 'male',    description: 'British narrator' },
  { id: 'onyx',    label: 'Onyx',    gender: 'male',    description: 'Deep and grounded' },
];

interface VoiceState {
  voiceId: VoiceId;
  /** Has the user explicitly chosen a voice yet? Used to show the picker on first use. */
  hasChosen: boolean;
  setVoice: (id: VoiceId) => void;
}

export const useVoiceStore = create<VoiceState>()(
  persist(
    (set) => ({
      voiceId: 'nova',
      hasChosen: false,
      setVoice: (id) => set({ voiceId: id, hasChosen: true }),
    }),
    {
      name: 'truwell-voice-prefs',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

export function voiceLabel(id: VoiceId): string {
  return VOICE_OPTIONS.find((v) => v.id === id)?.label ?? id;
}
