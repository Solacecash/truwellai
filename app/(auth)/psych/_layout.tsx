import { Stack } from 'expo-router';

export default function PsychOnboardingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        contentStyle: { backgroundColor: '#050F1A' },
      }}
    />
  );
}
