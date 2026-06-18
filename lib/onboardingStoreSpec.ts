import type { ConversionRole } from '@/lib/conversionOnboardingTypes';

import { useOnboardingStore } from '@/stores/onboardingStore';



export function getSpecRole(selectedRole: ConversionRole | ''): ConversionRole | null {

  return selectedRole === 'guardian' ? selectedRole : null;

}



export function getSpecSelectedGoals(

  _selectedRole: ConversionRole | '',

  guardianGoals: string[]

): string[] {

  return [...guardianGoals];

}



export function useSpecOnboardingStore() {

  const selectedRole = useOnboardingStore((s) => s.selectedRole);

  const guardianGoals = useOnboardingStore((s) => s.guardianGoals);

  const setAnswer = useOnboardingStore((s) => s.setAnswer);

  const setRole = useOnboardingStore((s) => s.setRole);

  const toggleGoal = useOnboardingStore((s) => s.toggleGoal);



  return {

    role: getSpecRole(selectedRole),

    selectedGoals: getSpecSelectedGoals(selectedRole, guardianGoals),

    setAnswer,

    setRole,

    toggleGoal,

    selectedRole,

    guardianGoals,

  };

}

