import { useEffect, useMemo, useState } from 'react';
import {
  AppState,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { toUserMessage } from '@/api/api-error';
import { useAuth } from '@/auth/auth-context';
import {
  calculatePregnancyProgress,
  formatDateOnly,
  formatDueDateMessage,
  formatPregnancyAge,
} from '@/onboarding/date-only';
import { useOnboarding } from '@/onboarding/onboarding-context';
import { AppColors, AppRadius, AppSpacing } from '@/ui/theme';

export default function PregnancyHomeScreen() {
  const { logout } = useAuth();
  const { state } = useOnboarding();
  const [today, setToday] = useState(() => new Date());
  const [logoutPending, setLogoutPending] = useState(false);
  const [logoutError, setLogoutError] = useState('');

  useEffect(() => {
    let midnightTimer: ReturnType<typeof setTimeout> | undefined;

    const scheduleMidnightRefresh = () => {
      if (midnightTimer) clearTimeout(midnightTimer);
      const now = new Date();
      const nextLocalMidnight = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() + 1,
      );
      const delay = Math.max(1_000, nextLocalMidnight.getTime() - now.getTime());

      midnightTimer = setTimeout(() => {
        setToday(new Date());
        scheduleMidnightRefresh();
      }, delay);
    };

    scheduleMidnightRefresh();
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        setToday(new Date());
        scheduleMidnightRefresh();
      }
    });
    return () => {
      if (midnightTimer) clearTimeout(midnightTimer);
      subscription.remove();
    };
  }, []);

  const pregnancy = state.status === 'ready' ? state.pregnancy : null;
  const progress = useMemo(
    () => (pregnancy ? calculatePregnancyProgress(pregnancy.dueDate, today) : null),
    [pregnancy, today],
  );

  if (state.status !== 'ready' || !pregnancy || !progress) return null;

  async function submitLogout() {
    if (logoutPending) return;
    setLogoutPending(true);
    setLogoutError('');
    try {
      await logout();
    } catch (error: unknown) {
      setLogoutError(toUserMessage(error));
      setLogoutPending(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <View style={styles.topBar}>
            <View>
              <Text style={styles.brand}>VỊT TRỜI</Text>
              <Text style={styles.brandNote}>Đồng hành cùng mẹ</Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Đăng xuất"
              accessibilityState={{ disabled: logoutPending, busy: logoutPending }}
              disabled={logoutPending}
              hitSlop={10}
              onPress={() => void submitLogout()}
              style={({ pressed }) => [
                styles.logoutButton,
                pressed && styles.logoutPressed,
                logoutPending && styles.logoutDisabled,
              ]}>
              <Text style={styles.logoutLabel}>
                {logoutPending ? 'Đang thoát...' : 'Đăng xuất'}
              </Text>
            </Pressable>
          </View>

          <View style={styles.greetingBlock}>
            <Text style={styles.greeting}>Xin chào 👋</Text>
            <Text style={styles.name}>{state.profile.fullName}</Text>
          </View>

          <Text style={styles.sectionLabel}>THAI KỲ CỦA MẸ</Text>
          <View style={styles.pregnancyCard}>
            <View style={styles.cardAccent} />
            <Text style={styles.estimatedLabel}>TUẦN THAI ƯỚC TÍNH</Text>
            <Text style={styles.pregnancyAge}>{formatPregnancyAge(progress)}</Text>
            <Text style={styles.countdown}>
              {formatDueDateMessage(progress.daysUntilDueDate)}
            </Text>
            <View style={styles.divider} />
            <View style={styles.dueDateRow}>
              <Text style={styles.dueDateLabel}>Ngày dự sinh</Text>
              <Text style={styles.dueDate}>{formatDateOnly(pregnancy.dueDate)}</Text>
            </View>
            <Text style={styles.medicalNote}>
              Tuần thai được ước tính dựa trên ngày dự sinh bạn cung cấp.
            </Text>
          </View>

          <View style={styles.preparationSection}>
            <Text style={styles.preparationTitle}>Chuẩn bị cho mẹ và bé</Text>
            <Text style={styles.preparationBody}>
              Các tính năng chuẩn bị sinh sẽ xuất hiện ở những Sprint tiếp theo.
            </Text>
          </View>

          {logoutError ? (
            <Text accessibilityLiveRegion="polite" style={styles.error}>
              {logoutError}
            </Text>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: AppColors.background },
  scrollContent: { flexGrow: 1 },
  content: {
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
    paddingHorizontal: AppSpacing.lg,
    paddingTop: AppSpacing.lg,
    paddingBottom: AppSpacing.xxl,
  },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  brand: { color: AppColors.primary, fontSize: 14, fontWeight: '800', letterSpacing: 2.2 },
  brandNote: { color: AppColors.textMuted, fontSize: 12, marginTop: 3 },
  logoutButton: {
    borderRadius: AppRadius.pill,
    borderWidth: 1,
    borderColor: AppColors.border,
    backgroundColor: AppColors.surface,
    paddingHorizontal: AppSpacing.md,
    paddingVertical: AppSpacing.sm,
  },
  logoutPressed: { opacity: 0.68 },
  logoutDisabled: { opacity: 0.5 },
  logoutLabel: { color: AppColors.primary, fontSize: 13, fontWeight: '700' },
  greetingBlock: { marginTop: AppSpacing.xxl },
  greeting: { color: AppColors.textMuted, fontSize: 17, lineHeight: 24 },
  name: {
    color: AppColors.text,
    fontSize: 30,
    fontWeight: '800',
    lineHeight: 38,
    marginTop: 2,
  },
  sectionLabel: {
    color: AppColors.primary,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginTop: AppSpacing.xl,
    marginBottom: AppSpacing.sm,
  },
  pregnancyCard: {
    overflow: 'hidden',
    backgroundColor: AppColors.surface,
    borderRadius: AppRadius.lg,
    borderWidth: 1,
    borderColor: AppColors.border,
    padding: AppSpacing.lg,
    shadowColor: '#6E4E47',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.07,
    shadowRadius: 24,
    elevation: 3,
  },
  cardAccent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 5,
    backgroundColor: AppColors.primary,
  },
  estimatedLabel: {
    color: AppColors.textMuted,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.35,
    textAlign: 'center',
  },
  pregnancyAge: {
    color: AppColors.text,
    fontSize: 34,
    fontWeight: '800',
    lineHeight: 44,
    textAlign: 'center',
    marginTop: AppSpacing.sm,
  },
  countdown: {
    color: AppColors.primary,
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 23,
    textAlign: 'center',
    marginTop: AppSpacing.xs,
  },
  divider: { height: 1, backgroundColor: AppColors.border, marginVertical: AppSpacing.lg },
  dueDateRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  dueDateLabel: { color: AppColors.textMuted, fontSize: 15 },
  dueDate: { color: AppColors.text, fontSize: 18, fontWeight: '800' },
  medicalNote: {
    color: AppColors.textMuted,
    fontSize: 12,
    lineHeight: 18,
    marginTop: AppSpacing.lg,
  },
  preparationSection: {
    marginTop: AppSpacing.xl,
    borderRadius: AppRadius.lg,
    backgroundColor: AppColors.softAccent,
    padding: AppSpacing.lg,
  },
  preparationTitle: { color: AppColors.text, fontSize: 19, fontWeight: '800' },
  preparationBody: {
    color: AppColors.textMuted,
    fontSize: 15,
    lineHeight: 23,
    marginTop: AppSpacing.sm,
  },
  error: {
    color: AppColors.error,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginTop: AppSpacing.lg,
  },
});
