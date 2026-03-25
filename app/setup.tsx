import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { InputField } from '../src/components/InputField';
import { AppButton } from '../src/components/AppButton';
import { useSettingsStore } from '../src/store/useSettingsStore';
import { settingsSchema, SettingsFormData } from '../src/utils/validators';
import { COLORS } from '../src/constants/paymentModes';

export default function SetupScreen() {
  const router = useRouter();
  const { saveSettings } = useSettingsStore();

  const { control, handleSubmit, formState: { isSubmitting } } = useForm<SettingsFormData>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      store_name: '',
      owner_name: '',
      phone: '',
      address: '',
      gstin: '',
      drug_license: '',
      invoice_prefix: 'MED',
    },
  });

  const onSubmit = async (data: SettingsFormData) => {
    await saveSettings({
      store_name: data.store_name,
      owner_name: data.owner_name ?? '',
      phone: data.phone ?? '',
      address: data.address ?? '',
      gstin: data.gstin ?? '',
      drug_license: data.drug_license ?? '',
      invoice_prefix: data.invoice_prefix,
    });
    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.logo}>💊 PharmaBill</Text>
        <Text style={styles.subtitle}>Setup your pharmacy to get started</Text>
      </View>
      <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
        <InputField name="store_name" control={control} label="Store Name *" placeholder="e.g. Sharma Medical" />
        <InputField name="owner_name" control={control} label="Owner Name" />
        <InputField name="phone" control={control} label="Phone Number" keyboardType="phone-pad" />
        <InputField name="address" control={control} label="Address" multiline numberOfLines={2} />
        <InputField name="gstin" control={control} label="GSTIN (optional)" />
        <InputField name="drug_license" control={control} label="Drug License No. (optional)" />
        <InputField name="invoice_prefix" control={control} label="Invoice Prefix" placeholder="e.g. MED" />
        <AppButton
          label="Save & Continue"
          onPress={handleSubmit(onSubmit)}
          loading={isSubmitting}
          style={styles.btn}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.primary },
  header: { padding: 24, paddingBottom: 20, alignItems: 'center' },
  logo: { fontSize: 28, fontWeight: '800', color: '#fff', letterSpacing: 1 },
  subtitle: { color: '#BBDEFB', marginTop: 4, fontSize: 14 },
  form: { backgroundColor: COLORS.background, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingTop: 24, flexGrow: 1 },
  btn: { marginTop: 12 },
});
