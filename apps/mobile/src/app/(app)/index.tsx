import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { toUserMessage } from '@/api/api-error';
import { useAuth } from '@/auth/auth-context';
import { AuthButton } from '@/components/auth-button';
import { AppColors, AppRadius, AppSpacing } from '@/ui/theme';

export default function AuthenticatedHomeScreen() {
  const { user, logout } = useAuth();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');

  async function submitLogout() {
    if (pending) return;
    setPending(true);
    setError('');
    try {
      await logout();
    } catch (logoutError: unknown) {
      setError(toUserMessage(logoutError));
      setPending(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.content}>
        <View>
          <Text style={styles.brand}>VỊT TRỜI</Text>
          <Text style={styles.greeting}>Xin chào.</Text>
          <Text style={styles.welcome}>Chào mừng bạn đến với Vịt Trời.</Text>
        </View>

        <View style={styles.accountCard}>
          <Text style={styles.label}>TÀI KHOẢN</Text>
          <Text style={styles.email}>{user?.email}</Text>
          <View style={styles.divider} />
          <Text style={styles.nextStep}>
            Hồ sơ thai kỳ của bạn sẽ được thiết lập ở bước tiếp theo.
          </Text>
        </View>

        <View style={styles.logoutArea}>
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <AuthButton
            label="Đăng xuất"
            loading={pending}
            onPress={() => void submitLogout()}
            variant="secondary"
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: AppColors.background },
  content: {
    flex: 1,
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
    padding: AppSpacing.lg,
    paddingTop: AppSpacing.xxl,
  },
  brand: { color: AppColors.primary, fontSize: 14, fontWeight: '800', letterSpacing: 2.2 },
  greeting: { color: AppColors.text, fontSize: 36, fontWeight: '800', marginTop: AppSpacing.lg },
  welcome: { color: AppColors.textMuted, fontSize: 17, marginTop: AppSpacing.sm },
  accountCard: {
    marginTop: AppSpacing.xl,
    padding: AppSpacing.lg,
    borderRadius: AppRadius.lg,
    backgroundColor: AppColors.surface,
    borderWidth: 1,
    borderColor: AppColors.border,
  },
  label: { color: AppColors.primary, fontSize: 12, fontWeight: '800', letterSpacing: 1.4 },
  email: { color: AppColors.text, fontSize: 18, fontWeight: '700', marginTop: AppSpacing.sm },
  divider: { height: 1, backgroundColor: AppColors.border, marginVertical: AppSpacing.lg },
  nextStep: { color: AppColors.textMuted, fontSize: 16, lineHeight: 24 },
  logoutArea: { marginTop: 'auto', gap: AppSpacing.sm, paddingTop: AppSpacing.xl },
  error: { color: AppColors.error, fontSize: 14, textAlign: 'center' },
});
