import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { InputField } from '../../src/components/InputField';
import { AppButton } from '../../src/components/AppButton';
import { useMedicineStore } from '../../src/store/useMedicineStore';
import { medicineSchema, MedicineFormData } from '../../src/utils/validators';
import { COLORS, GST_RATES } from '../../src/constants/paymentModes';
import { nowISO } from '../../src/utils/date';

export default function AddMedicineScreen() {
  const router = useRouter();
  const { addMedicine } = useMedicineStore();

  const { control, handleSubmit, formState: { isSubmitting } } = useForm<MedicineFormData>({
    resolver: zodResolver(medicineSchema),
    defaultValues: {
      name: '',
      generic_name: '',
      batch_no: '',
      expiry_month: undefined,
      expiry_year: undefined,
      mrp: undefined as unknown as number,
      selling_price: undefined as unknown as number,
      gst_percent: 12,
      stock_qty: 0,
    },
  });

  const onSubmit = async (data: MedicineFormData) => {
    await addMedicine({
      name: data.name,
      generic_name: data.generic_name ?? '',
      batch_no: data.batch_no ?? '',
      expiry_month: data.expiry_month ?? null,
      expiry_year: data.expiry_year ?? null,
      mrp: data.mrp,
      selling_price: data.selling_price,
      gst_percent: data.gst_percent,
      stock_qty: data.stock_qty,
      created_at: nowISO(),
      updated_at: nowISO(),
    });
    router.back();
  };

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <InputField name="name" control={control} label="Medicine Name *" />
        <InputField name="generic_name" control={control} label="Generic Name" />
        <InputField name="batch_no" control={control} label="Batch No." />
        <View style={styles.row}>
          <View style={{ flex: 1, marginRight: 8 }}>
            <InputField name="expiry_month" control={control} label="Expiry Month (1-12)" keyboardType="numeric" />
          </View>
          <View style={{ flex: 1 }}>
            <InputField name="expiry_year" control={control} label="Expiry Year" keyboardType="numeric" />
          </View>
        </View>
        <View style={styles.row}>
          <View style={{ flex: 1, marginRight: 8 }}>
            <InputField name="mrp" control={control} label="MRP (₹) *" keyboardType="numeric" />
          </View>
          <View style={{ flex: 1 }}>
            <InputField name="selling_price" control={control} label="Selling Price (₹) *" keyboardType="numeric" />
          </View>
        </View>
        <View style={styles.row}>
          <View style={{ flex: 1, marginRight: 8 }}>
            <InputField name="gst_percent" control={control} label="GST % *" keyboardType="numeric" />
          </View>
          <View style={{ flex: 1 }}>
            <InputField name="stock_qty" control={control} label="Stock Qty *" keyboardType="numeric" />
          </View>
        </View>
        <Text style={styles.hint}>Common GST rates: 0%, 5%, 12%, 18%, 28%</Text>
        <AppButton label="Save Medicine" onPress={handleSubmit(onSubmit)} loading={isSubmitting} style={styles.btn} />
        <AppButton label="Cancel" onPress={() => router.back()} variant="outline" style={{ marginTop: 8 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  scroll: { padding: 16, paddingBottom: 32 },
  row: { flexDirection: 'row' },
  hint: { fontSize: 12, color: COLORS.textSecondary, marginBottom: 16 },
  btn: { marginTop: 8 },
});
