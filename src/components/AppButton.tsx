import React from 'react';
import { StyleSheet } from 'react-native';
import { Button } from 'react-native-paper';
import { COLORS } from '../constants/paymentModes';

type Variant = 'primary' | 'secondary' | 'danger' | 'outline';

interface Props {
  label: string;
  onPress: () => void;
  variant?: Variant;
  disabled?: boolean;
  loading?: boolean;
  icon?: string;
  style?: object;
}

export function AppButton({
  label,
  onPress,
  variant = 'primary',
  disabled,
  loading,
  icon,
  style,
}: Props) {
  const variantStyle = {
    primary: { buttonColor: COLORS.primary, textColor: '#fff' },
    secondary: { buttonColor: COLORS.secondary, textColor: '#fff' },
    danger: { buttonColor: COLORS.danger, textColor: '#fff' },
    outline: { buttonColor: 'transparent', textColor: COLORS.primary },
  }[variant];

  return (
    <Button
      mode={variant === 'outline' ? 'outlined' : 'contained'}
      onPress={onPress}
      disabled={disabled}
      loading={loading}
      icon={icon}
      buttonColor={variantStyle.buttonColor}
      textColor={variantStyle.textColor}
      style={[styles.button, style]}
      contentStyle={styles.content}
    >
      {label}
    </Button>
  );
}

const styles = StyleSheet.create({
  button: { borderRadius: 8 },
  content: { height: 46 },
});
