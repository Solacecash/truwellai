import { Redirect } from 'expo-router';

export default function GuardianGoalsRedirect() {
  return <Redirect href="/(onboarding)/goals" />;
}
