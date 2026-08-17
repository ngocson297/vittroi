import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppColors, AppSpacing } from '@/ui/theme';

export function AuthLoadingScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.content}>
        <Text style={styles.brand}>VỊT TRỜI</Text>
        <ActivityIndicator color={AppColors.primary} size="large" />
        <Text style={styles.message}>Đang kiểm tra phiên đăng nhập...</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: AppColors.background },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: AppSpacing.lg },
  brand: { color: AppColors.primary, fontSize: 28, fontWeight: '800', letterSpacing: 2.5 },
  message: { color: AppColors.textMuted, fontSize: 15 },
});
