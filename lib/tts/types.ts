export type TTSLanguageCode = 'en-US' | 'es-US' | 'fr-FR' | 'de-DE' | 'it-IT';

export interface NIMTTSVoice {
  name: string;
  languageCode: TTSLanguageCode;
  displayName: string;
  gender: 'female' | 'male';
}

export type NIMTTSStatus = 'idle' | 'loading' | 'playing' | 'paused' | 'complete' | 'error';

export interface NIMTTSState {
  status: NIMTTSStatus;
  currentMessageId: string | null;
  durationMs: number;
  progressMs: number;
  error: string | null;
  selectedVoice: NIMTTSVoice;
  selectedLanguage: TTSLanguageCode;
}

export interface NIMTTSHookReturn extends NIMTTSState {
  speak: (text: string, messageId: string) => Promise<void>;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  setVoice: (voice: NIMTTSVoice) => void;
  isNIMAvailable: boolean;
  availableVoices: NIMTTSVoice[];
}
