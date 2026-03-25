import React, { useEffect } from 'react';
import { ScrollView, StyleSheet, View, Alert } from 'react-native';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { InputField } from '../../src/components/InputField';
import { AppButton } from '../../src/components/AppButton';
import { useMedicineStore } from '../../src/store/useMedicineStore';
import { medicineSchema, MedicineFormData } from '../../src/utils/validators';
import { COLORS } from '../../src/constants/paymentModes';
import { nowISO } from '../../src/utils/date';

export default function EditMedicineScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { medicines, updateMedicine, deleteMedicine } = useMedicineStore();

  const medicine = medicines.find((m) => String(m.id) === id);

  const { control, handleSubmit, reset, formState: { isSubmitting } } = useForm<MedicineFormData>({
    resolver: zodResolver(medicineSchema),
    defaultValues: {
      name: '',
      generic_name: '',
      batch_no: '',
      expiry_month: undefined,
      expiry_year: undefined,
      mrp: 0,
      selling_price: 0,
      gst_percent: 12,
      stock_qty: 0,
    },
  });

  useEffect(() => {
    if (medicine) {
      reset({
        name: medicine.name,
        generic_name: medicine.generic_name ?? '',
        batch_no: medicine.batch_no ?? '',
        expiry_month: medicine.expiry_month ?? undefined,
        expiry_year: medicine.expiry_year ?? undefined,
        mrp: medicine.mrp,
        selling_price: medicine.selling_price,
        gst_percent: medicine.gst_percent,
        stock_qty: medicine.stock_qty,
      });
    }
  }, [medicine]);

  const onSubmit = async (data: MedicineFormData) => {
    if (!medicine?.id) return;
    await updateMedicine({
      ...medicine,
      name: data.name,
      generic_name: data.generic_name ?? '',
      batch_no: data.batch_no ?? '',
      expiry_month: data.expiry_month ?? null,
      expiry_year: data.expiry_year ?? null,
      mrp: data.mrp,
      selling_price: data.selling_price,
      gst_percent: data.gst_percent,
      stock_qty: data.stock_qty,
      updated_at: nowISO(),
    });
    router.back();
  };

  const handleDelete = () => {
    Alert.alert('Delete Medicine', `Delete "${medicine?.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteMedicine(medicine!.id!);
          router.back();
        },
      },
    ]);
  };

  if (!medicine) return null;

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <InputField name="name" control={control} label="Medicine Name *" />
        <InputField name="generic_name" control={control} label="Generic Name" />
        <InputField name="batch_no" control={control} label="Batch No." />
        <View style={styles.row}>
          <View style={{ flex: 1, marginRight: 8 }}>
            <InputField name="expiry_month" control={control} label="Expiry Month" keyboardType="numeric" />
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
            <InputField name="gst_percent" control={control} label="GST %" keyboardType="numeric" />
          </View>
          <View style={{ flex: 1 }}>
            <InputField name="stock_qty" control={control} label="Stock Qty" keyboardType="numeric" />
          </View>
        </View>
        <AppButton label="Update Medicine" onPress={handleSubmit(onSubmit)} loading={isSubmitting} style={styles.btn} />
        <AppButton label="Delete Medicine" onPress={handleDelete} variant="danger" style={{ marginTop: 8 }} />
        <AppButton label="Cancel" onPress={() => router.back()} variant="outline" style={{ marginTop: 8 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  scroll: { padding: 16, paddingBottom: 32 },
  row: { flexDirection: 'row' },
  btn: { marginTop: 8 },
});
