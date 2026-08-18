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
  validateDateOfBirthInput,
  vietnameseDateToDateOnly,
} from '@/onboarding/date-only';
import { useOnboarding } from '@/onboarding/onboarding-context';
import { validateFullName } from '@/onboarding/profile-validation';
import { AppColors } from '@/ui/theme';

interface ProfileErrors {
  fullName?: string;
  dateOfBirth?: string;
}

export default function MotherProfileScreen() {
  const { logout } = useAuth();
  const { api, reload } = useOnboarding();
  const [fullName, setFullName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [errors, setErrors] = useState<ProfileErrors>({});
  const [submitError, setSubmitError] = useState('');
  const [pending, setPending] = useState(false);
  const submitLocked = useRef(false);

  function validate(): string | null {
    const nextErrors: ProfileErrors = {
      fullName: validateFullName(fullName) ?? undefined,
      dateOfBirth: validateDateOfBirthInput(dateOfBirth) ?? undefined,
    };
    setErrors(nextErrors);
    return nextErrors.fullName ?? nextErrors.dateOfBirth ?? null;
  }

  async function submit() {
    if (submitLocked.current || validate()) return;
    const apiDateOfBirth = vietnameseDateToDateOnly(dateOfBirth);
    if (!apiDateOfBirth) return;

    submitLocked.current = true;
    setPending(true);
    setSubmitError('');
    try {
      await api.createMotherProfile({
        fullName: fullName.trim(),
        dateOfBirth: apiDateOfBirth,
      });
      await reload();
    } catch (error: unknown) {
      if (error instanceof ApiError && error.code === 'PROFILE_ALREADY_EXISTS') {
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
      step="Bước 1 / 2"
      title="Thông tin của mẹ"
      subtitle="Hãy cho Vịt Trời biết một chút về bạn để bắt đầu hành trình."
      footer={
        <TextAction
          label="Đăng xuất"
          disabled={pending}
          onPress={() => void logout()}
        />
      }>
      <FormField
        label="Họ và tên"
        value={fullName}
        onChangeText={(value) => {
          setFullName(value);
          setErrors((current) => ({ ...current, fullName: undefined }));
        }}
        error={errors.fullName}
        placeholder="Nguyễn Thị A"
        autoCapitalize="words"
        autoCorrect={false}
        autoComplete="name"
        maxLength={200}
        returnKeyType="next"
      />
      <FormField
        label="Ngày sinh"
        value={dateOfBirth}
        onChangeText={(value) => {
          setDateOfBirth(formatVietnameseDateInput(value));
          setErrors((current) => ({ ...current, dateOfBirth: undefined }));
        }}
        error={errors.dateOfBirth}
        placeholder="DD/MM/YYYY"
        keyboardType="number-pad"
        inputMode="numeric"
        maxLength={10}
        autoCorrect={false}
        accessibilityHint="Nhập ngày, tháng và năm sinh"
        returnKeyType="done"
        onSubmitEditing={() => void submit()}
      />
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
  error: { color: AppColors.error, fontSize: 14, lineHeight: 20 },
});
