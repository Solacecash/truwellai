import { useTheme } from '@/theme/ThemeContext';
import { Stack } from 'expo-router';

export default function AuthLayout() {
  const { theme } = useTheme();
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: theme.bg0 },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="welcome"                    options={{ headerShown: false, gestureEnabled: false }} />
      <Stack.Screen name="sign-in"                    options={{ headerShown: false }} />
      <Stack.Screen name="login"                      options={{ headerShown: false }} />
      <Stack.Screen name="register"                   options={{ headerShown: false }} />
      <Stack.Screen name="check-email"                options={{ headerShown: false }} />
      <Stack.Screen name="pending"                    options={{ headerShown: false }} />
      <Stack.Screen name="onboarding/health-profile"  options={{ headerShown: false }} />
      <Stack.Screen name="onboarding/preferences"     options={{ headerShown: false }} />
      <Stack.Screen name="onboarding/notifications"   options={{ headerShown: false }} />
    </Stack>
  );
}
