import { Stack } from 'expo-router';

import { useAuth } from '@/auth/auth-context';
import { OnboardingStatusScreen } from '@/components/onboarding-status-screen';
import {
  OnboardingProvider,
  useOnboarding,
} from '@/onboarding/onboarding-context';

function OnboardingNavigator() {
  const { logout } = useAuth();
  const { state, reload } = useOnboarding();

  if (state.status === 'loading') {
    return <OnboardingStatusScreen status="loading" />;
  }

  if (state.status === 'error') {
    return (
      <OnboardingStatusScreen
        status="error"
        message={state.message}
        onRetry={() => void reload()}
        onLogout={() => void logout()}
      />
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
      <Stack.Protected guard={state.status === 'needs-profile'}>
        <Stack.Screen
          name="onboarding/mother-profile"
          options={{ gestureEnabled: false }}
        />
      </Stack.Protected>
      <Stack.Protected guard={state.status === 'needs-pregnancy'}>
        <Stack.Screen
          name="onboarding/pregnancy"
          options={{ gestureEnabled: false }}
        />
      </Stack.Protected>
      <Stack.Protected guard={state.status === 'ready'}>
        <Stack.Screen name="index" />
      </Stack.Protected>
    </Stack>
  );
}

export default function AppLayout() {
  return (
    <OnboardingProvider>
      <OnboardingNavigator />
    </OnboardingProvider>
  );
}
