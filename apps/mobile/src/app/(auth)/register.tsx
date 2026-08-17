import { Link } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';

import { toUserMessage } from '@/api/api-error';
import { useAuth } from '@/auth/auth-context';
import { AuthButton } from '@/components/auth-button';
import { AuthFormScreen } from '@/components/auth-form-screen';
import { FormField } from '@/components/form-field';
import { AppColors, AppSpacing } from '@/ui/theme';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface RegisterErrors {
  email?: string;
  password?: string;
  confirmation?: string;
}

export default function RegisterScreen() {
  const { register } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [errors, setErrors] = useState<RegisterErrors>({});
  const [submitError, setSubmitError] = useState('');
  const [pending, setPending] = useState(false);

  function validate(): boolean {
    const nextErrors: RegisterErrors = {};
    if (!EMAIL_PATTERN.test(email.trim())) {
      nextErrors.email = 'Vui lòng nhập địa chỉ email hợp lệ.';
    }
    if (password.length < 8 || password.length > 128) {
      nextErrors.password = 'Mật khẩu cần có từ 8 đến 128 ký tự.';
    }
    if (!confirmation) {
      nextErrors.confirmation = 'Vui lòng xác nhận mật khẩu.';
    } else if (confirmation !== password) {
      nextErrors.confirmation = 'Mật khẩu xác nhận chưa khớp.';
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function submit() {
    if (pending || !validate()) return;
    setPending(true);
    setSubmitError('');
    try {
      await register(email, password);
    } catch (error: unknown) {
      setSubmitError(toUserMessage(error));
    } finally {
      setPending(false);
    }
  }

  return (
    <AuthFormScreen
      title="Tạo tài khoản"
      subtitle="Bắt đầu hành trình của bạn cùng Vịt Trời."
      footer={
        <Text style={styles.footerText}>
          Đã có tài khoản?{' '}
          <Link href="./login" style={styles.link}>
            Đăng nhập
          </Link>
        </Text>
      }>
      <FormField
        label="Email"
        value={email}
        onChangeText={setEmail}
        error={errors.email}
        placeholder="mom@example.com"
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        textContentType="emailAddress"
      />
      <FormField
        label="Mật khẩu"
        value={password}
        onChangeText={setPassword}
        error={errors.password}
        placeholder="Tối thiểu 8 ký tự"
        secureTextEntry
        textContentType="newPassword"
      />
      <FormField
        label="Xác nhận mật khẩu"
        value={confirmation}
        onChangeText={setConfirmation}
        error={errors.confirmation}
        placeholder="Nhập lại mật khẩu"
        secureTextEntry
        textContentType="newPassword"
        returnKeyType="done"
        onSubmitEditing={() => void submit()}
      />
      {submitError ? <Text style={styles.error}>{submitError}</Text> : null}
      <AuthButton label="Tạo tài khoản" loading={pending} onPress={() => void submit()} />
    </AuthFormScreen>
  );
}

const styles = StyleSheet.create({
  error: { color: AppColors.error, fontSize: 14, lineHeight: 20 },
  footerText: { color: AppColors.textMuted, fontSize: 15, padding: AppSpacing.sm },
  link: { color: AppColors.primary, fontWeight: '700' },
});
