import React from 'react';
import { View, StyleSheet } from 'react-native';
import { TextInput, HelperText } from 'react-native-paper';
import { Controller, Control, FieldValues, Path } from 'react-hook-form';
import { COLORS } from '../constants/paymentModes';

interface Props<T extends FieldValues> {
  name: Path<T>;
  control: Control<T>;
  label: string;
  placeholder?: string;
  keyboardType?: 'default' | 'numeric' | 'email-address' | 'phone-pad';
  multiline?: boolean;
  numberOfLines?: number;
  secureTextEntry?: boolean;
  right?: React.ReactNode;
}

export function InputField<T extends FieldValues>({
  name,
  control,
  label,
  placeholder,
  keyboardType = 'default',
  multiline,
  numberOfLines,
  secureTextEntry,
  right,
}: Props<T>) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
        <View style={styles.container}>
          <TextInput
            label={label}
            placeholder={placeholder}
            value={value != null ? String(value) : ''}
            onChangeText={onChange}
            onBlur={onBlur}
            keyboardType={keyboardType}
            multiline={multiline}
            numberOfLines={numberOfLines}
            secureTextEntry={secureTextEntry}
            mode="outlined"
            error={!!error}
            activeOutlineColor={COLORS.primary}
            right={right}
            style={styles.input}
          />
          {error ? (
            <HelperText type="error" visible>
              {error.message}
            </HelperText>
          ) : null}
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 8 },
  input: { backgroundColor: '#fff' },
});
