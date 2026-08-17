import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AuthButton } from '@/components/auth-button';
import { AppColors, AppRadius, AppSpacing } from '@/ui/theme';

export default function WelcomeScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.content}>
        <View style={styles.hero}>
          <View style={styles.mark}>
            <Text style={styles.markText}>V</Text>
          </View>
          <Text style={styles.brand}>VỊT TRỜI</Text>
          <Text style={styles.headline}>Đồng hành cùng mẹ{`\n`}từ thai kỳ đến sau sinh.</Text>
          <Text style={styles.description}>
            Một không gian bình yên để bạn chuẩn bị cho hành trình làm mẹ.
          </Text>
        </View>
        <View style={styles.actions}>
          <AuthButton label="Đăng nhập" onPress={() => router.push('./login')} />
          <AuthButton
            label="Tạo tài khoản"
            onPress={() => router.push('./register')}
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
    justifyContent: 'space-between',
    padding: AppSpacing.lg,
    paddingTop: AppSpacing.xxl,
  },
  hero: { flex: 1, justifyContent: 'center' },
  mark: {
    width: 68,
    height: 68,
    borderRadius: AppRadius.pill,
    backgroundColor: AppColors.softAccent,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: AppSpacing.lg,
  },
  markText: { color: AppColors.primary, fontSize: 30, fontWeight: '800' },
  brand: { color: AppColors.primary, fontSize: 15, letterSpacing: 2.5, fontWeight: '800' },
  headline: {
    color: AppColors.text,
    fontSize: 37,
    lineHeight: 46,
    fontWeight: '800',
    marginTop: AppSpacing.md,
  },
  description: {
    color: AppColors.textMuted,
    fontSize: 17,
    lineHeight: 26,
    marginTop: AppSpacing.md,
    maxWidth: 420,
  },
  actions: { gap: AppSpacing.sm, paddingBottom: AppSpacing.md },
});
