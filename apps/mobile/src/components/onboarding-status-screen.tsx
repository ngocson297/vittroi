import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AuthButton } from '@/components/auth-button';
import { AppColors, AppSpacing } from '@/ui/theme';

interface OnboardingStatusScreenProps {
  status: 'loading' | 'error';
  message?: string;
  onRetry?: () => void;
  onLogout?: () => void;
}

export function OnboardingStatusScreen({
  status,
  message,
  onRetry,
  onLogout,
}: OnboardingStatusScreenProps) {
  const loading = status === 'loading';

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.content}>
        <Text style={styles.brand}>VỊT TRỜI</Text>
        {loading ? <ActivityIndicator color={AppColors.primary} size="large" /> : null}
        <Text style={styles.title}>
          {loading ? 'Đang chuẩn bị hành trình của bạn...' : 'Chưa thể tải thông tin'}
        </Text>
        {!loading ? (
          <>
            <Text style={styles.message}>{message}</Text>
            <View style={styles.actions}>
              <AuthButton label="Thử lại" onPress={() => onRetry?.()} />
              <AuthButton
                label="Đăng xuất"
                onPress={() => onLogout?.()}
                variant="secondary"
              />
            </View>
          </>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: AppColors.background },
  content: {
    flex: 1,
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    padding: AppSpacing.lg,
    gap: AppSpacing.lg,
  },
  brand: { color: AppColors.primary, fontSize: 27, fontWeight: '800', letterSpacing: 2.4 },
  title: { color: AppColors.text, fontSize: 20, fontWeight: '700', textAlign: 'center' },
  message: {
    color: AppColors.textMuted,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
  actions: { alignSelf: 'stretch', gap: AppSpacing.sm, marginTop: AppSpacing.sm },
});
