import { Pressable, StyleSheet, Text } from 'react-native';

import { AppColors, AppSpacing } from '@/ui/theme';

interface TextActionProps {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}

export function TextAction({ label, onPress, disabled = false }: TextActionProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      hitSlop={8}
      onPress={onPress}
      style={({ pressed }) => [
        styles.action,
        pressed && !disabled && styles.pressed,
        disabled && styles.disabled,
      ]}>
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  action: { paddingHorizontal: AppSpacing.sm, paddingVertical: AppSpacing.sm },
  pressed: { opacity: 0.64 },
  disabled: { opacity: 0.45 },
  label: { color: AppColors.primary, fontSize: 15, fontWeight: '700' },
});
