import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

import type {
  ConversionRole,
  GuardianHealthStatus,
  GuardianLifestyleAnswers,
} from '@/lib/conversionOnboardingTypes';
import {
  CONVERSION_FLOW_VERSION_DEFAULT,
  defaultGuardianHealthStatus,
  defaultGuardianLifestyle,
} from '@/lib/conversionOnboardingTypes';
import { CONVERSION_MAX_STEP, migrateConversionFlowStep } from '@/lib/onboardingService';
import { clampGuardianScore, resolveHealthScore } from '@/lib/onboardingScores';
import type { PsychStepNumber } from '@/lib/psychFlow';

export type UserType = 'user' | null;
export type WizardStep = 1 | 2 | 3 | 4 | 5;

const PSYCH_STORAGE_KEY = 'truwell_psych_v1';
const CONVERSION_STORAGE_KEY = 'truwell_conversion_onboarding_v1';

export interface UserFormData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  age: string;
  sex: string;
  conditions: string[];
  allergies: string[];
  locationOptIn: boolean;
  latitude: number | null;
  longitude: number | null;
  countryCode: string | null;
  lifeStage: string;
  medications: string;
  supplements: string;
  referralSource: string;
  selectedPlan: string;
}

export interface PsychOnboardingSnapshot {
  psychStep: PsychStepNumber;
  psychFlowComplete: boolean;
  healthGoal: string;
  weightRange: string;
  painPoints: string[];
  activityLevel: string;
  dietStyle: string;
  dailyMinutes: number;
  planGenerated: boolean;
}

interface ConversionPersistPayload {
  v: number;
  conversionFlowComplete: boolean;
  conversionFlowStep: number;
  selectedRole: ConversionRole | '';
  userName: string;
  guardianGoals: string[];
  guardianHealthStatus: GuardianHealthStatus;
  guardianConversionPainPoints: string[];
  guardianLifestyleAnswers: GuardianLifestyleAnswers;
  guardianDailyMinutes: number;
  conversionBlueprintReady: boolean;
  healthScore: number;
  completionPercent: number;
  assessmentAnswers: Record<string, string>;
  ageRange: string;
  gender: string;
  conditions: string[];
  allergies: string[];
  dietType: string;
  productConcerns: string[];
  familyRole: string;
  fitnessLevel: string;
  lifestyle: string;
  stressLevel: string;
}

interface OnboardingState {
  splashComplete: boolean;
  setSplashComplete: (v: boolean) => void;

  currentSlide: number;
  setCurrentSlide: (n: number) => void;

  selectedType: UserType;
  setSelectedType: (t: UserType) => void;

  wizardOpen: boolean;
  setWizardOpen: (v: boolean) => void;
  wizardStep: WizardStep;
  setWizardStep: (s: WizardStep) => void;

  userForm: UserFormData;
  setUserField: <K extends keyof UserFormData>(field: K, value: UserFormData[K]) => void;

  onboardingComplete: boolean;
  setOnboardingComplete: (v: boolean) => void;

  psychStep: PsychStepNumber;
  psychFlowComplete: boolean;
  healthGoal: string;
  weightRange: string;
  painPoints: string[];
  activityLevel: string;
  dietStyle: string;
  dailyMinutes: number;
  planGenerated: boolean;

  goToStep: (step: PsychStepNumber) => void;
  setPsychAnswers: (
    partial: Partial<
      Pick<
        OnboardingState,
        | 'healthGoal'
        | 'weightRange'
        | 'painPoints'
        | 'activityLevel'
        | 'dietStyle'
        | 'dailyMinutes'
        | 'planGenerated'
      >
    >
  ) => void;
  completePsychFlow: () => void;
  hydratePsychFromStorage: () => Promise<void>;
  persistPsychSnapshot: () => Promise<void>;
  resetPsychAnswers: () => void;

  conversionFlowComplete: boolean;
  setConversionFlowComplete: (v: boolean) => void;
  conversionFlowStep: number;
  setConversionFlowStep: (step: number) => void;
  conversionBlueprintReady: boolean;
  setConversionBlueprintReady: (v: boolean) => void;
  conversionStorageHydrated: boolean;

  selectedRole: ConversionRole | '';
  setRole: (r: ConversionRole) => void;
  userName: string;
  setUserName: (name: string) => void;
  guardianGoals: string[];
  setGuardianGoals: (goals: string[]) => void;
  guardianHealthStatus: GuardianHealthStatus;
  setGuardianHealthStatus: (partial: Partial<GuardianHealthStatus>) => void;
  guardianConversionPainPoints: string[];
  setGuardianPainPointsConversion: (items: string[]) => void;
  guardianLifestyleAnswers: GuardianLifestyleAnswers;
  setGuardianLifestyle: (partial: Partial<GuardianLifestyleAnswers>) => void;
  guardianDailyMinutes: number;
  setGuardianDailyMinutes: (minutes: number) => void;

  healthScore: number;
  setHealthScore: (score: number) => void;
  completionPercent: number;
  setCompletionPercent: (percent: number) => void;
  assessmentAnswers: Record<string, string>;
  setAssessmentAnswer: (key: string, value: string) => void;
  setAnswer: (questionId: string, value: string) => void;
  ageRange: string;
  gender: string;
  conditions: string[];
  allergies: string[];
  dietType: string;
  productConcerns: string[];
  familyRole: string;
  fitnessLevel: string;
  lifestyle: string;
  stressLevel: string;
  setAgeRange: (value: string) => void;
  setGender: (value: string) => void;
  setConditions: (values: string[]) => void;
  setAllergies: (values: string[]) => void;
  setDietType: (value: string) => void;
  setProductConcerns: (values: string[]) => void;
  setFamilyRole: (value: string) => void;
  setFitnessLevel: (value: string) => void;
  setLifestyle: (value: string) => void;
  setStressLevel: (value: string) => void;
  getSelectedGoals: () => string[];
  toggleGoal: (goal: string) => void;

  hydrateConversionFromStorage: () => Promise<void>;
  persistConversionSnapshot: () => Promise<void>;
  resetConversionOnboarding: () => void;

  reset: () => void;
}

const defaultUserForm: UserFormData = {
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  age: '',
  sex: '',
  conditions: [],
  allergies: [],
  locationOptIn: false,
  latitude: null,
  longitude: null,
  countryCode: null,
  lifeStage: '',
  medications: '',
  supplements: '',
  referralSource: '',
  selectedPlan: 'free',
};

const defaultPsych: Omit<PsychOnboardingSnapshot, 'psychStep' | 'psychFlowComplete'> = {
  healthGoal: '',
  weightRange: '',
  painPoints: [],
  activityLevel: '',
  dietStyle: '',
  dailyMinutes: 20,
  planGenerated: false,
};

function defaultConversionState(): Omit<ConversionPersistPayload, 'v'> {
  return {
    conversionFlowComplete: false,
    conversionFlowStep: 1,
    selectedRole: '',
    userName: '',
    guardianGoals: [],
    guardianHealthStatus: defaultGuardianHealthStatus(),
    guardianConversionPainPoints: [],
    guardianLifestyleAnswers: defaultGuardianLifestyle(),
    guardianDailyMinutes: 20,
    conversionBlueprintReady: false,
    healthScore: 72,
    completionPercent: 0,
    assessmentAnswers: {},
    ageRange: '',
    gender: '',
    conditions: [],
    allergies: [],
    dietType: '',
    productConcerns: [],
    familyRole: '',
    fitnessLevel: '',
    lifestyle: '',
    stressLevel: '',
  };
}

function migrateConversionPersist(data: Partial<ConversionPersistPayload> | null): ConversionPersistPayload {
  const base = defaultConversionState();
  const merged: ConversionPersistPayload = {
    v: typeof data?.v === 'number' ? data.v : 0,
    conversionFlowComplete: Boolean(data?.conversionFlowComplete ?? base.conversionFlowComplete),
    conversionFlowStep: typeof data?.conversionFlowStep === 'number' ? data.conversionFlowStep : base.conversionFlowStep,
    selectedRole: data?.selectedRole === 'guardian' ? 'guardian' : '',
    userName: typeof data?.userName === 'string' ? data.userName : base.userName,
    guardianGoals: Array.isArray(data?.guardianGoals) ? [...data!.guardianGoals!] : base.guardianGoals,
    guardianHealthStatus: {
      ...base.guardianHealthStatus,
      ...(typeof data?.guardianHealthStatus === 'object' && data?.guardianHealthStatus
        ? data.guardianHealthStatus
        : {}),
    },
    guardianConversionPainPoints: Array.isArray(data?.guardianConversionPainPoints)
      ? [...data!.guardianConversionPainPoints!]
      : base.guardianConversionPainPoints,
    guardianLifestyleAnswers: {
      ...base.guardianLifestyleAnswers,
      ...(typeof data?.guardianLifestyleAnswers === 'object' && data?.guardianLifestyleAnswers
        ? data.guardianLifestyleAnswers
        : {}),
    },
    guardianDailyMinutes:
      typeof data?.guardianDailyMinutes === 'number' ? data.guardianDailyMinutes : base.guardianDailyMinutes,
    conversionBlueprintReady: Boolean(data?.conversionBlueprintReady ?? base.conversionBlueprintReady),
    healthScore: typeof data?.healthScore === 'number' ? data.healthScore : base.healthScore,
    completionPercent:
      typeof data?.completionPercent === 'number' ? data.completionPercent : base.completionPercent,
    assessmentAnswers:
      typeof data?.assessmentAnswers === 'object' && data?.assessmentAnswers
        ? { ...data.assessmentAnswers }
        : base.assessmentAnswers,
    ageRange: typeof data?.ageRange === 'string' ? data.ageRange : base.ageRange,
    gender: typeof data?.gender === 'string' ? data.gender : base.gender,
    conditions: Array.isArray(data?.conditions) ? [...data.conditions] : base.conditions,
    allergies: Array.isArray(data?.allergies) ? [...data.allergies] : base.allergies,
    dietType: typeof data?.dietType === 'string' ? data.dietType : base.dietType,
    productConcerns: Array.isArray(data?.productConcerns)
      ? [...data.productConcerns]
      : base.productConcerns,
    familyRole: typeof data?.familyRole === 'string' ? data.familyRole : base.familyRole,
    fitnessLevel: typeof data?.fitnessLevel === 'string' ? data.fitnessLevel : base.fitnessLevel,
    lifestyle: typeof data?.lifestyle === 'string' ? data.lifestyle : base.lifestyle,
    stressLevel: typeof data?.stressLevel === 'string' ? data.stressLevel : base.stressLevel,
  };

  const fromVersion = merged.v;

  const hasAnswers = Boolean(
    merged.selectedRole ||
      merged.guardianGoals.length > 0 ||
      merged.conversionBlueprintReady
  );

  if (fromVersion < CONVERSION_FLOW_VERSION_DEFAULT && !hasAnswers && !merged.conversionFlowComplete) {
    merged.conversionFlowStep = 1;
    merged.selectedRole = '';
  }

  merged.v = CONVERSION_FLOW_VERSION_DEFAULT;

  if (fromVersion < 5) {
    merged.conversionFlowStep = migrateConversionFlowStep(
      merged.conversionFlowStep,
      merged.selectedRole
    );
  }

  if (fromVersion < 6) {
    merged.conversionFlowStep = migrateConversionFlowStep(
      merged.conversionFlowStep,
      merged.selectedRole
    );
  }

  merged.conversionFlowStep = Math.min(CONVERSION_MAX_STEP, Math.max(1, merged.conversionFlowStep));

  if (merged.conversionFlowStep >= 3 && !merged.selectedRole && !merged.conversionFlowComplete) {
    merged.conversionFlowStep = 1;
    merged.selectedRole = '';
  }

  return merged;
}

function snapshotFromPsychState(s: OnboardingState): PsychOnboardingSnapshot {
  return {
    psychStep: s.psychStep,
    psychFlowComplete: s.psychFlowComplete,
    healthGoal: s.healthGoal,
    weightRange: s.weightRange,
    painPoints: s.painPoints,
    activityLevel: s.activityLevel,
    dietStyle: s.dietStyle,
    dailyMinutes: s.dailyMinutes,
    planGenerated: s.planGenerated,
  };
}

function snapshotConversionFromState(s: OnboardingState): ConversionPersistPayload {
  return {
    v: CONVERSION_FLOW_VERSION_DEFAULT,
    conversionFlowComplete: s.conversionFlowComplete,
    conversionFlowStep: s.conversionFlowStep,
    selectedRole: s.selectedRole,
    userName: s.userName,
    guardianGoals: s.guardianGoals,
    guardianHealthStatus: { ...s.guardianHealthStatus },
    guardianConversionPainPoints: s.guardianConversionPainPoints,
    guardianLifestyleAnswers: { ...s.guardianLifestyleAnswers },
    guardianDailyMinutes: s.guardianDailyMinutes,
    conversionBlueprintReady: s.conversionBlueprintReady,
    healthScore: s.healthScore,
    completionPercent: s.completionPercent,
    assessmentAnswers: { ...s.assessmentAnswers },
    ageRange: s.ageRange,
    gender: s.gender,
    conditions: [...s.conditions],
    allergies: [...s.allergies],
    dietType: s.dietType,
    productConcerns: [...s.productConcerns],
    familyRole: s.familyRole,
    fitnessLevel: s.fitnessLevel,
    lifestyle: s.lifestyle,
    stressLevel: s.stressLevel,
  };
}

export const useOnboardingStore = create<OnboardingState>((set, get) => {
  const convDefaults = defaultConversionState();
  return {
    splashComplete: false,
    setSplashComplete: (v) => set({ splashComplete: v }),
    currentSlide: 0,
    setCurrentSlide: (n) => set({ currentSlide: n }),
    selectedType: null,
    setSelectedType: (t) => set({ selectedType: t }),
    wizardOpen: false,
    setWizardOpen: (v) => set({ wizardOpen: v }),
    wizardStep: 1,
    setWizardStep: (s) => set({ wizardStep: s }),
    userForm: defaultUserForm,
    setUserField: (field, value) =>
      set((state) => ({ userForm: { ...state.userForm, [field]: value } })),
    onboardingComplete: false,
    setOnboardingComplete: (v) => set({ onboardingComplete: v }),

    psychStep: 1,
    psychFlowComplete: false,
    healthGoal: '',
    weightRange: '',
    painPoints: [],
    activityLevel: '',
    dietStyle: '',
    dailyMinutes: convDefaults.guardianDailyMinutes,
    planGenerated: false,

    goToStep: (step) => {
      set({ psychStep: step });
      void get().persistPsychSnapshot();
    },

    setPsychAnswers: (partial) => {
      set((state) => ({ ...state, ...partial }));
      void get().persistPsychSnapshot();
    },

    completePsychFlow: () => {
      set({ psychFlowComplete: true, psychStep: 13 });
      void get().persistPsychSnapshot();
    },

    hydratePsychFromStorage: async () => {
      try {
        const raw = await AsyncStorage.getItem(PSYCH_STORAGE_KEY);
        if (!raw) return;
        const data = JSON.parse(raw) as Partial<PsychOnboardingSnapshot>;
        set((prev) => ({
          ...prev,
          psychStep: (typeof data.psychStep === 'number' ? data.psychStep : 1) as PsychStepNumber,
          psychFlowComplete: Boolean(data.psychFlowComplete),
          healthGoal: typeof data.healthGoal === 'string' ? data.healthGoal : '',
          weightRange: typeof data.weightRange === 'string' ? data.weightRange : '',
          painPoints: Array.isArray(data.painPoints) ? data.painPoints : [],
          activityLevel: typeof data.activityLevel === 'string' ? data.activityLevel : '',
          dietStyle: typeof data.dietStyle === 'string' ? data.dietStyle : '',
          dailyMinutes: typeof data.dailyMinutes === 'number' ? data.dailyMinutes : prev.dailyMinutes,
          planGenerated: Boolean(data.planGenerated),
        }));
      } catch {
        /* ignore */
      }
    },

    persistPsychSnapshot: async () => {
      try {
        const s = get();
        await AsyncStorage.setItem(PSYCH_STORAGE_KEY, JSON.stringify(snapshotFromPsychState(s)));
      } catch {
        /* ignore */
      }
    },

    resetPsychAnswers: () => {
      set((prev) => ({
        ...prev,
        ...defaultPsych,
        psychStep: 1,
        psychFlowComplete: false,
      }));
      void AsyncStorage.removeItem(PSYCH_STORAGE_KEY);
    },

    conversionFlowComplete: convDefaults.conversionFlowComplete,
    setConversionFlowComplete: (conversionFlowComplete) => {
      set({ conversionFlowComplete });
      void get().persistConversionSnapshot();
    },
    conversionFlowStep: convDefaults.conversionFlowStep,
    setConversionFlowStep: (step) => {
      const clamped = Math.min(CONVERSION_MAX_STEP, Math.max(1, Math.floor(step)));
      set({ conversionFlowStep: clamped });
      void get().persistConversionSnapshot();
    },

    conversionBlueprintReady: convDefaults.conversionBlueprintReady,
    setConversionBlueprintReady: (conversionBlueprintReady) => {
      set({ conversionBlueprintReady });
      void get().persistConversionSnapshot();
    },
    conversionStorageHydrated: false,

    selectedRole: convDefaults.selectedRole,
    setRole: (selectedRole) => {
      const healthScore = resolveHealthScore(selectedRole);
      set({ selectedRole, healthScore });
      void get().persistConversionSnapshot();
    },
    userName: '',
    setUserName: (userName) => {
      set({ userName });
      void get().persistConversionSnapshot();
    },
    guardianGoals: convDefaults.guardianGoals,
    setGuardianGoals: (guardianGoals) => {
      set({ guardianGoals: [...guardianGoals] });
      void get().persistConversionSnapshot();
    },
    guardianHealthStatus: convDefaults.guardianHealthStatus,
    setGuardianHealthStatus: (partial) => {
      set((state) => ({
        guardianHealthStatus: {
          ...state.guardianHealthStatus,
          ...partial,
        },
      }));
      void get().persistConversionSnapshot();
    },
    guardianConversionPainPoints: convDefaults.guardianConversionPainPoints,
    setGuardianPainPointsConversion: (guardianConversionPainPoints) => {
      set({ guardianConversionPainPoints: [...guardianConversionPainPoints] });
      void get().persistConversionSnapshot();
    },
    guardianLifestyleAnswers: convDefaults.guardianLifestyleAnswers,
    setGuardianLifestyle: (partial) => {
      set((state) => ({
        guardianLifestyleAnswers: {
          ...state.guardianLifestyleAnswers,
          ...partial,
        },
      }));
      void get().persistConversionSnapshot();
    },
    guardianDailyMinutes: convDefaults.guardianDailyMinutes,
    setGuardianDailyMinutes: (minutes) => {
      const normalized = Math.min(60, Math.max(5, Math.round(minutes / 5) * 5));
      set({
        guardianDailyMinutes: normalized,
        dailyMinutes: normalized,
      });
      void get().persistPsychSnapshot();
      void get().persistConversionSnapshot();
    },

    healthScore: convDefaults.healthScore,
    setHealthScore: (healthScore) => {
      set({ healthScore: clampGuardianScore(healthScore) });
      void get().persistConversionSnapshot();
    },
    completionPercent: convDefaults.completionPercent,
    setCompletionPercent: (completionPercent) => {
      set({ completionPercent });
      void get().persistConversionSnapshot();
    },
    assessmentAnswers: convDefaults.assessmentAnswers,
    setAssessmentAnswer: (key, value) => {
      set((state) => ({
        assessmentAnswers: { ...state.assessmentAnswers, [key]: value },
      }));
      void get().persistConversionSnapshot();
    },
    setAnswer: (questionId, value) => {
      set((state) => ({
        assessmentAnswers: { ...state.assessmentAnswers, [questionId]: value },
      }));
      void get().persistConversionSnapshot();
    },
    getSelectedGoals: () => [...get().guardianGoals],
    toggleGoal: (goal) => {
      set((state) => {
        const has = state.guardianGoals.includes(goal);
        const guardianGoals = has
          ? state.guardianGoals.filter((g) => g !== goal)
          : [...state.guardianGoals, goal];
        return { guardianGoals };
      });
      void get().persistConversionSnapshot();
    },

    ageRange: convDefaults.ageRange,
    gender: convDefaults.gender,
    conditions: convDefaults.conditions,
    allergies: convDefaults.allergies,
    dietType: convDefaults.dietType,
    productConcerns: convDefaults.productConcerns,
    familyRole: convDefaults.familyRole,
    fitnessLevel: convDefaults.fitnessLevel,
    lifestyle: convDefaults.lifestyle,
    stressLevel: convDefaults.stressLevel,

    setAgeRange: (ageRange) => {
      set((state) => ({
        ageRange,
        assessmentAnswers: { ...state.assessmentAnswers, age: ageRange },
      }));
      void get().persistConversionSnapshot();
    },
    setGender: (gender) => {
      set((state) => ({
        gender,
        assessmentAnswers: { ...state.assessmentAnswers, gender },
      }));
      void get().persistConversionSnapshot();
    },
    setConditions: (conditions) => {
      set((state) => ({
        conditions: [...conditions],
        assessmentAnswers: {
          ...state.assessmentAnswers,
          conditions: conditions.join(','),
        },
      }));
      void get().persistConversionSnapshot();
    },
    setAllergies: (allergies) => {
      set((state) => ({
        allergies: [...allergies],
        assessmentAnswers: {
          ...state.assessmentAnswers,
          allergies: allergies.join(','),
        },
      }));
      void get().persistConversionSnapshot();
    },
    setDietType: (dietType) => {
      set((state) => ({
        dietType,
        assessmentAnswers: { ...state.assessmentAnswers, dietType },
      }));
      void get().persistConversionSnapshot();
    },
    setProductConcerns: (productConcerns) => {
      set((state) => ({
        productConcerns: [...productConcerns],
        assessmentAnswers: {
          ...state.assessmentAnswers,
          productConcerns: productConcerns.join(','),
        },
      }));
      void get().persistConversionSnapshot();
    },
    setFamilyRole: (familyRole) => {
      set((state) => ({
        familyRole,
        assessmentAnswers: { ...state.assessmentAnswers, familyRole },
      }));
      void get().persistConversionSnapshot();
    },
    setFitnessLevel: (fitnessLevel) => {
      set((state) => ({
        fitnessLevel,
        assessmentAnswers: { ...state.assessmentAnswers, fitnessLevel },
      }));
      void get().persistConversionSnapshot();
    },
    setLifestyle: (lifestyle) => {
      set({ lifestyle });
      void get().persistConversionSnapshot();
    },
    setStressLevel: (stressLevel) => {
      set({ stressLevel });
      void get().persistConversionSnapshot();
    },

    hydrateConversionFromStorage: async () => {
      try {
        const raw = await AsyncStorage.getItem(CONVERSION_STORAGE_KEY);
        const parsed =
          typeof raw === 'string' ? (JSON.parse(raw) as Partial<ConversionPersistPayload>) : {};
        const merged = migrateConversionPersist(parsed ?? null);
        set((prev) => ({
          ...prev,
          conversionFlowComplete: merged.conversionFlowComplete,
          conversionFlowStep: merged.conversionFlowStep,
          conversionBlueprintReady: merged.conversionBlueprintReady,
          selectedRole: merged.selectedRole,
          userName: merged.userName,
          guardianGoals: merged.guardianGoals,
          guardianHealthStatus: merged.guardianHealthStatus,
          guardianConversionPainPoints: merged.guardianConversionPainPoints,
          guardianLifestyleAnswers: merged.guardianLifestyleAnswers,
          guardianDailyMinutes: merged.guardianDailyMinutes,
          healthScore: merged.healthScore,
          completionPercent: merged.completionPercent,
          assessmentAnswers: merged.assessmentAnswers,
          ageRange: merged.ageRange,
          gender: merged.gender,
          conditions: merged.conditions,
          allergies: merged.allergies,
          dietType: merged.dietType,
          productConcerns: merged.productConcerns,
          familyRole: merged.familyRole,
          fitnessLevel: merged.fitnessLevel,
          lifestyle: merged.lifestyle,
          stressLevel: merged.stressLevel,
          dailyMinutes: merged.guardianDailyMinutes ?? prev.dailyMinutes,
          conversionStorageHydrated: true,
        }));
      } catch {
        set({ conversionStorageHydrated: true });
      }
    },

    persistConversionSnapshot: async () => {
      try {
        await AsyncStorage.setItem(
          CONVERSION_STORAGE_KEY,
          JSON.stringify(snapshotConversionFromState(get()))
        );
      } catch {
        /* ignore */
      }
    },

    resetConversionOnboarding: () => {
      void AsyncStorage.removeItem(CONVERSION_STORAGE_KEY);
      const fresh = migrateConversionPersist(null);
      const { v: _dropVersion, ...rest } = fresh;
      set((prev) => ({
        ...prev,
        ...rest,
        conversionStorageHydrated: true,
      }));
      void get().persistConversionSnapshot();
    },

    reset: () => {
      void AsyncStorage.removeItem(PSYCH_STORAGE_KEY);
      void AsyncStorage.removeItem(CONVERSION_STORAGE_KEY);
      const migrated = migrateConversionPersist(null);
      const { v: _dropVer, ...conversionRest } = migrated;
      set({
        splashComplete: false,
        currentSlide: 0,
        selectedType: null,
        wizardOpen: false,
        wizardStep: 1,
        userForm: defaultUserForm,
        onboardingComplete: false,
        psychStep: 1,
        psychFlowComplete: false,
        ...defaultPsych,
        ...conversionRest,
        dailyMinutes: conversionRest.guardianDailyMinutes ?? 20,
      });
    },
  };
});

export const useTruwellOnboardingStore = useOnboardingStore;
