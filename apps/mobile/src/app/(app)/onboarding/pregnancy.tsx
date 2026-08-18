import { useRef, useState } from 'react';
import { StyleSheet, Text } from 'react-native';

import { ApiError, toUserMessage } from '@/api/api-error';
import { useAuth } from '@/auth/auth-context';
import { AuthButton } from '@/components/auth-button';
import { FormField } from '@/components/form-field';
import { OnboardingFormScreen } from '@/components/onboarding-form-screen';
import { TextAction } from '@/components/text-action';
import {
  formatVietnameseDateInput,
  validateDueDateInput,
  vietnameseDateToDateOnly,
} from '@/onboarding/date-only';
import { useOnboarding } from '@/onboarding/onboarding-context';
import { AppColors, AppSpacing } from '@/ui/theme';

export default function PregnancySetupScreen() {
  const { logout } = useAuth();
  const { api, reload } = useOnboarding();
  const [dueDate, setDueDate] = useState('');
  const [dueDateError, setDueDateError] = useState<string>();
  const [submitError, setSubmitError] = useState('');
  const [pending, setPending] = useState(false);
  const submitLocked = useRef(false);

  async function submit() {
    if (submitLocked.current) return;
    const validationError = validateDueDateInput(dueDate);
    setDueDateError(validationError ?? undefined);
    if (validationError) return;

    const apiDueDate = vietnameseDateToDateOnly(dueDate);
    if (!apiDueDate) return;

    submitLocked.current = true;
    setPending(true);
    setSubmitError('');
    try {
      await api.createPregnancy({ dueDate: apiDueDate });
      await reload();
    } catch (error: unknown) {
      if (
        error instanceof ApiError &&
        error.code === 'ACTIVE_PREGNANCY_ALREADY_EXISTS'
      ) {
        await reload();
        return;
      }
      setSubmitError(toUserMessage(error));
    } finally {
      submitLocked.current = false;
      setPending(false);
    }
  }

  return (
    <OnboardingFormScreen
      step="Bước 2 / 2"
      title="Ngày dự sinh"
      subtitle="Ngày bé dự kiến chào đời là khi nào?"
      footer={
        <TextAction
          label="Đăng xuất"
          disabled={pending}
          onPress={() => void logout()}
        />
      }>
      <FormField
        label="Ngày dự sinh"
        value={dueDate}
        onChangeText={(value) => {
          setDueDate(formatVietnameseDateInput(value));
          setDueDateError(undefined);
        }}
        error={dueDateError}
        placeholder="DD/MM/YYYY"
        keyboardType="number-pad"
        inputMode="numeric"
        maxLength={10}
        autoCorrect={false}
        accessibilityHint="Nhập ngày, tháng và năm dự sinh"
        returnKeyType="done"
        onSubmitEditing={() => void submit()}
      />
      <Text style={styles.hint}>Bạn có thể thay đổi thông tin này sau.</Text>
      {submitError ? (
        <Text accessibilityLiveRegion="polite" style={styles.error}>
          {submitError}
        </Text>
      ) : null}
      <AuthButton label="Tiếp tục" loading={pending} onPress={() => void submit()} />
    </OnboardingFormScreen>
  );
}

const styles = StyleSheet.create({
  hint: {
    color: AppColors.textMuted,
    fontSize: 13,
    lineHeight: 19,
    marginTop: -AppSpacing.xs,
  },
  error: { color: AppColors.error, fontSize: 14, lineHeight: 20 },
});
