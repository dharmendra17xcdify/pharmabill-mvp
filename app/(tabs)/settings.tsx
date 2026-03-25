import React from 'react';
import { View, ScrollView, StyleSheet, Alert } from 'react-native';
import { Text } from 'react-native-paper';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { SafeAreaView } from 'react-native-safe-area-context';
import { InputField } from '../../src/components/InputField';
import { AppButton } from '../../src/components/AppButton';
import { useSettingsStore } from '../../src/store/useSettingsStore';
import { settingsSchema, SettingsFormData } from '../../src/utils/validators';
import { getDb } from '../../src/db';
import { COLORS } from '../../src/constants/paymentModes';

export default function SettingsScreen() {
  const { settings, saveSettings, loadSettings } = useSettingsStore();

  const { control, handleSubmit, formState: { isSubmitting } } = useForm<SettingsFormData>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      store_name: settings?.store_name ?? '',
      owner_name: settings?.owner_name ?? '',
      phone: settings?.phone ?? '',
      address: settings?.address ?? '',
      gstin: settings?.gstin ?? '',
      drug_license: settings?.drug_license ?? '',
      invoice_prefix: settings?.invoice_prefix ?? 'MED',
    },
  });

  const onSubmit = async (data: SettingsFormData) => {
    await saveSettings({
      ...settings,
      store_name: data.store_name,
      owner_name: data.owner_name ?? '',
      phone: data.phone ?? '',
      address: data.address ?? '',
      gstin: data.gstin ?? '',
      drug_license: data.drug_license ?? '',
      invoice_prefix: data.invoice_prefix,
    });
    Alert.alert('Saved', 'Store settings updated successfully.');
  };

  const handleReset = () => {
    Alert.alert(
      'Reset All Data',
      'This will permanently delete ALL medicines, bills, and settings. This cannot be undone!',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset Everything',
          style: 'destructive',
          onPress: async () => {
            const db = getDb();
            await db.execAsync(`DELETE FROM bill_items; DELETE FROM bills; DELETE FROM medicines; DELETE FROM store_settings; UPDATE app_meta SET value = '0' WHERE key = 'last_invoice_number';`);
            await loadSettings();
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.section}>Store Details</Text>
        <InputField name="store_name" control={control} label="Store Name *" />
        <InputField name="owner_name" control={control} label="Owner Name" />
        <InputField name="phone" control={control} label="Phone" keyboardType="phone-pad" />
        <InputField name="address" control={control} label="Address" multiline numberOfLines={2} />
        <InputField name="gstin" control={control} label="GSTIN" />
        <InputField name="drug_license" control={control} label="Drug License No." />
        <InputField name="invoice_prefix" control={control} label="Invoice Prefix" placeholder="MED" />

        <AppButton
          label="Save Settings"
          onPress={handleSubmit(onSubmit)}
          loading={isSubmitting}
          style={styles.saveBtn}
        />

        <Text style={[styles.section, { marginTop: 28, color: COLORS.danger }]}>Danger Zone</Text>
        <AppButton
          label="Reset All Data"
          onPress={handleReset}
          variant="danger"
        />
        <Text style={styles.warning}>
          ⚠️ This will delete all medicines, bills, and settings permanently.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  scroll: { padding: 16, paddingBottom: 32 },
  section: { fontSize: 14, fontWeight: '700', color: COLORS.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12, marginTop: 4 },
  saveBtn: { marginTop: 8 },
  warning: { fontSize: 12, color: COLORS.textSecondary, marginTop: 8, textAlign: 'center' },
});
