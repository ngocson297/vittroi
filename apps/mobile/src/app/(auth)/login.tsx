import { Link } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';

import { toUserMessage } from '@/api/api-error';
import { useAuth } from '@/auth/auth-context';
import { AuthButton } from '@/components/auth-button';
import { AuthFormScreen } from '@/components/auth-form-screen';
import { FormField } from '@/components/form-field';
import { AppColors, AppSpacing } from '@/ui/theme';

export default function LoginScreen() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);

  async function submit() {
    if (pending) return;
    if (!email.trim() || !password) {
      setError('Vui lòng nhập email và mật khẩu.');
      return;
    }

    setPending(true);
    setError('');
    try {
      await login(email, password);
    } catch (submitError: unknown) {
      setError(toUserMessage(submitError));
    } finally {
      setPending(false);
    }
  }

  return (
    <AuthFormScreen
      title="Đăng nhập"
      subtitle="Chào mừng bạn trở lại với Vịt Trời."
      footer={
        <Text style={styles.footerText}>
          Chưa có tài khoản?{' '}
          <Link href="./register" style={styles.link}>
            Tạo tài khoản
          </Link>
        </Text>
      }>
      <FormField
        label="Email"
        value={email}
        onChangeText={setEmail}
        placeholder="mom@example.com"
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        textContentType="emailAddress"
        returnKeyType="next"
      />
      <FormField
        label="Mật khẩu"
        value={password}
        onChangeText={setPassword}
        placeholder="Nhập mật khẩu"
        secureTextEntry
        textContentType="password"
        returnKeyType="done"
        onSubmitEditing={() => void submit()}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <AuthButton label="Đăng nhập" loading={pending} onPress={() => void submit()} />
    </AuthFormScreen>
  );
}

const styles = StyleSheet.create({
  error: { color: AppColors.error, fontSize: 14, lineHeight: 20 },
  footerText: { color: AppColors.textMuted, fontSize: 15, padding: AppSpacing.sm },
  link: { color: AppColors.primary, fontWeight: '700' },
});
