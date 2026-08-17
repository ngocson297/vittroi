import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';

import { AppColors, AppRadius, AppSpacing } from '@/ui/theme';

interface AuthButtonProps {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'secondary';
}

export function AuthButton({
  label,
  onPress,
  loading = false,
  disabled = false,
  variant = 'primary',
}: AuthButtonProps) {
  const isDisabled = loading || disabled;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        variant === 'primary' ? styles.primary : styles.secondary,
        pressed && !isDisabled && styles.pressed,
        isDisabled && styles.disabled,
      ]}>
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? '#FFFFFF' : AppColors.primary} />
      ) : (
        <Text style={[styles.label, variant === 'secondary' && styles.secondaryLabel]}>
          {label}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 52,
    borderRadius: AppRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: AppSpacing.lg,
  },
  primary: { backgroundColor: AppColors.primary },
  secondary: {
    backgroundColor: AppColors.surface,
    borderWidth: 1,
    borderColor: AppColors.border,
  },
  pressed: { opacity: 0.84 },
  disabled: { opacity: 0.56 },
  label: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  secondaryLabel: { color: AppColors.primary },
});
