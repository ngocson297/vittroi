import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { AuthProvider, useAuth } from '@/auth/auth-context';
import { AuthLoadingScreen } from '@/components/auth-loading-screen';

function RootNavigator() {
  const { status } = useAuth();

  if (status === 'loading') return <AuthLoadingScreen />;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Protected guard={status === 'unauthenticated'}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
      <Stack.Protected guard={status === 'authenticated'}>
        <Stack.Screen name="(app)" />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <StatusBar style="dark" />
      <RootNavigator />
    </AuthProvider>
  );
}
