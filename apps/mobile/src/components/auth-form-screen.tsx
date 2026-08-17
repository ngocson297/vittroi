import type { PropsWithChildren, ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppColors, AppRadius, AppSpacing } from '@/ui/theme';

interface AuthFormScreenProps extends PropsWithChildren {
  title: string;
  subtitle: string;
  footer: ReactNode;
}

export function AuthFormScreen({
  title,
  subtitle,
  footer,
  children,
}: AuthFormScreenProps) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled">
          <View style={styles.content}>
            <View style={styles.brandMark} accessible accessibilityLabel="Vịt Trời">
              <Text style={styles.brandLetter}>V</Text>
            </View>
            <Text style={styles.eyebrow}>VỊT TRỜI</Text>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.subtitle}>{subtitle}</Text>
            <View style={styles.card}>{children}</View>
            <View style={styles.footer}>{footer}</View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: AppColors.background },
  keyboardView: { flex: 1 },
  scrollContent: { flexGrow: 1, justifyContent: 'center', padding: AppSpacing.lg },
  content: { width: '100%', maxWidth: 480, alignSelf: 'center' },
  brandMark: {
    width: 52,
    height: 52,
    borderRadius: AppRadius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AppColors.softAccent,
    marginBottom: AppSpacing.md,
  },
  brandLetter: { color: AppColors.primary, fontSize: 23, fontWeight: '800' },
  eyebrow: {
    color: AppColors.primary,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1.8,
    marginBottom: AppSpacing.sm,
  },
  title: { color: AppColors.text, fontSize: 32, fontWeight: '800', lineHeight: 39 },
  subtitle: {
    color: AppColors.textMuted,
    fontSize: 16,
    lineHeight: 24,
    marginTop: AppSpacing.sm,
  },
  card: {
    backgroundColor: AppColors.surface,
    borderRadius: AppRadius.lg,
    borderWidth: 1,
    borderColor: AppColors.border,
    padding: AppSpacing.lg,
    gap: AppSpacing.md,
    marginTop: AppSpacing.xl,
  },
  footer: { alignItems: 'center', marginTop: AppSpacing.lg },
});
