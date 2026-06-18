import { create } from 'zustand';

export type HealthProfile = {
  allergies?: string[];
  conditions?: string[];
  dietPreference?: string;
  avoids?: string[];
};

export type UserProfile = {
  id: string;
  display_name: string | null;
  locale: string | null;
  health_profile: HealthProfile | null;
  reputation_score?: number | null;
  user_type?: string | null;
  subscription_tier?: string | null;
  referral_code?: string | null;
};

interface UserProfileState {
  profile: UserProfile | null;
  setProfile: (p: UserProfile | null) => void;
}

export const useUserProfileStore = create<UserProfileState>((set) => ({
  profile: null,
  setProfile: (profile) => set({ profile }),
}));
