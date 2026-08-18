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

interface OnboardingFormScreenProps extends PropsWithChildren {
  step: string;
  title: string;
  subtitle: string;
  footer?: ReactNode;
}

export function OnboardingFormScreen({
  step,
  title,
  subtitle,
  footer,
  children,
}: OnboardingFormScreenProps) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}>
          <View style={styles.content}>
            <View style={styles.headerRow}>
              <View style={styles.brandMark} accessible accessibilityLabel="Vịt Trời">
                <Text style={styles.brandLetter}>V</Text>
              </View>
              <View style={styles.stepPill}>
                <Text style={styles.stepText}>{step}</Text>
              </View>
            </View>

            <Text style={styles.eyebrow}>VỊT TRỜI</Text>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.subtitle}>{subtitle}</Text>

            <View style={styles.card}>{children}</View>
            {footer ? <View style={styles.footer}>{footer}</View> : null}
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
  content: { width: '100%', maxWidth: 500, alignSelf: 'center' },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: AppSpacing.lg,
  },
  brandMark: {
    width: 52,
    height: 52,
    borderRadius: AppRadius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AppColors.softAccent,
  },
  brandLetter: { color: AppColors.primary, fontSize: 23, fontWeight: '800' },
  stepPill: {
    borderRadius: AppRadius.pill,
    backgroundColor: AppColors.surface,
    borderWidth: 1,
    borderColor: AppColors.border,
    paddingHorizontal: AppSpacing.md,
    paddingVertical: AppSpacing.sm,
  },
  stepText: { color: AppColors.textMuted, fontSize: 13, fontWeight: '700' },
  eyebrow: {
    color: AppColors.primary,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1.8,
    marginBottom: AppSpacing.sm,
  },
  title: { color: AppColors.text, fontSize: 32, fontWeight: '800', lineHeight: 40 },
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
    shadowColor: '#6E4E47',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 2,
  },
  footer: { alignItems: 'center', marginTop: AppSpacing.lg },
});
