import { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  type TextInputProps,
  View,
} from 'react-native';

import { AppColors, AppRadius, AppSpacing } from '@/ui/theme';

interface FormFieldProps extends TextInputProps {
  label: string;
  error?: string;
}

export function FormField({
  label,
  error,
  secureTextEntry = false,
  ...inputProps
}: FormFieldProps) {
  const [passwordVisible, setPasswordVisible] = useState(false);
  const hidesValue = secureTextEntry && !passwordVisible;

  return (
    <View style={styles.group}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.inputRow, error && styles.inputError]}>
        <TextInput
          accessibilityLabel={label}
          placeholderTextColor="#9B918D"
          secureTextEntry={hidesValue}
          style={styles.input}
          {...inputProps}
        />
        {secureTextEntry && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={passwordVisible ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
            hitSlop={10}
            onPress={() => setPasswordVisible((visible) => !visible)}>
            <Text style={styles.visibility}>{passwordVisible ? 'Ẩn' : 'Hiện'}</Text>
          </Pressable>
        )}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  group: { gap: AppSpacing.xs },
  label: { color: AppColors.text, fontSize: 14, fontWeight: '700' },
  inputRow: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: AppColors.border,
    backgroundColor: '#FFFEFD',
    borderRadius: AppRadius.md,
    paddingHorizontal: AppSpacing.md,
  },
  inputError: { borderColor: AppColors.error },
  input: { flex: 1, color: AppColors.text, fontSize: 16, paddingVertical: AppSpacing.sm },
  visibility: { color: AppColors.primary, fontWeight: '700', paddingLeft: AppSpacing.sm },
  error: { color: AppColors.error, fontSize: 13, lineHeight: 18 },
});
