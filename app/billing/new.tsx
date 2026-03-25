import React, { useState, useCallback } from 'react';
import {
  View, FlatList, StyleSheet, TouchableOpacity, Alert, ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Text, Searchbar, Divider } from 'react-native-paper';
import { useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TextInput } from 'react-native-paper';
import { CartItemRow } from '../../src/components/CartItemRow';
import { SummaryCard } from '../../src/components/SummaryCard';
import { AppButton } from '../../src/components/AppButton';
import { MedicineCard } from '../../src/components/MedicineCard';
import { useBillingStore } from '../../src/store/useBillingStore';
import { useMedicineStore } from '../../src/store/useMedicineStore';
import { useSettingsStore } from '../../src/store/useSettingsStore';
import { Medicine } from '../../src/types/medicine';
import { PAYMENT_MODES, COLORS } from '../../src/constants/paymentModes';
import { saveBill, getNextInvoiceNumber } from '../../src/db/billRepo';
import { nowISO } from '../../src/utils/date';

export default function NewBillScreen() {
  const router = useRouter();
  const { cartItems, addToCart, removeFromCart, updateQty, clearCart, computeTotals } = useBillingStore();
  const { medicines, loadMedicines } = useMedicineStore();
  const { settings } = useSettingsStore();

  const [search, setSearch] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [paymentMode, setPaymentMode] = useState<string>('Cash');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [saving, setSaving] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadMedicines();
    }, [])
  );

  const searchResults = search.trim()
    ? medicines.filter(
        (m) =>
          m.name.toLowerCase().includes(search.toLowerCase()) ||
          (m.generic_name?.toLowerCase().includes(search.toLowerCase()) ?? false)
      )
    : [];

  const handleAddMedicine = (medicine: Medicine) => {
    addToCart(medicine, 1);
    setSearch('');
    setShowSearch(false);
  };

  const totals = computeTotals();

  const handleSaveBill = async () => {
    if (cartItems.length === 0) {
      Alert.alert('Empty Cart', 'Please add at least one medicine to the bill.');
      return;
    }
    setSaving(true);
    try {
      const prefix = settings?.invoice_prefix ?? 'MED';
      const billNumber = await getNextInvoiceNumber(prefix);
      const now = nowISO();

      const billId = await saveBill(
        {
          bill_number: billNumber,
          customer_name: customerName,
          customer_phone: customerPhone,
          subtotal: totals.subtotal,
          gst_total: totals.gstTotal,
          discount_total: 0,
          grand_total: totals.grandTotal,
          payment_mode: paymentMode,
          created_at: now,
        },
        cartItems.map((item) => ({
          medicine_id: item.medicine_id,
          medicine_name: item.medicine_name,
          batch_no: item.batch_no,
          qty: item.qty,
          unit_price: item.unit_price,
          gst_percent: item.gst_percent,
          gst_amount: item.gst_amount,
          line_total: item.line_total,
        }))
      );

      clearCart();
      router.replace({ pathname: '/billing/preview', params: { billId: String(billId) } });
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Failed to save bill. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {/* Search Bar */}
        <View style={styles.searchArea}>
          <Searchbar
            placeholder="Search & add medicine..."
            value={search}
            onChangeText={(v) => { setSearch(v); setShowSearch(v.length > 0); }}
            onFocus={() => setShowSearch(search.length > 0)}
            style={styles.searchBar}
            inputStyle={styles.searchInput}
          />
        </View>

        {/* Search Results Dropdown */}
        {showSearch && searchResults.length > 0 && (
          <View style={styles.dropdown}>
            <FlatList
              data={searchResults.slice(0, 6)}
              keyExtractor={(item) => String(item.id)}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => (
                <MedicineCard
                  medicine={item}
                  showAddButton
                  onAdd={handleAddMedicine}
                />
              )}
            />
          </View>
        )}

        <ScrollView
          style={{ flex: 1 }}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: 16 }}
        >
          {/* Cart Items */}
          {cartItems.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>🔍 Search above to add medicines</Text>
            </View>
          ) : (
            cartItems.map((item) => (
              <CartItemRow
                key={item.medicine_id}
                item={item}
                onRemove={removeFromCart}
                onQtyChange={updateQty}
              />
            ))
          )}

          {cartItems.length > 0 && (
            <>
              {/* Totals */}
              <SummaryCard
                subtotal={totals.subtotal}
                gstTotal={totals.gstTotal}
                grandTotal={totals.grandTotal}
              />

              {/* Customer Details */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Customer (Optional)</Text>
                <TextInput
                  label="Customer Name"
                  value={customerName}
                  onChangeText={setCustomerName}
                  mode="outlined"
                  style={styles.textInput}
                  activeOutlineColor={COLORS.primary}
                />
                <TextInput
                  label="Customer Phone"
                  value={customerPhone}
                  onChangeText={setCustomerPhone}
                  keyboardType="phone-pad"
                  mode="outlined"
                  style={[styles.textInput, { marginTop: 8 }]}
                  activeOutlineColor={COLORS.primary}
                />
              </View>

              {/* Payment Mode */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Payment Mode</Text>
                <View style={styles.paymentRow}>
                  {PAYMENT_MODES.map((mode) => (
                    <TouchableOpacity
                      key={mode}
                      style={[styles.payBtn, paymentMode === mode && styles.payBtnActive]}
                      onPress={() => setPaymentMode(mode)}
                    >
                      <Text style={[styles.payBtnText, paymentMode === mode && styles.payBtnTextActive]}>
                        {mode === 'Cash' ? '💵' : mode === 'UPI' ? '📱' : '💳'} {mode}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.actions}>
                <AppButton
                  label="Save & Generate Bill"
                  onPress={handleSaveBill}
                  loading={saving}
                  icon="file-document"
                />
                <AppButton
                  label="Clear Cart"
                  onPress={() => {
                    Alert.alert('Clear Cart', 'Remove all items?', [
                      { text: 'Cancel', style: 'cancel' },
                      { text: 'Clear', style: 'destructive', onPress: clearCart },
                    ]);
                  }}
                  variant="outline"
                  style={{ marginTop: 8 }}
                />
              </View>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  searchArea: { padding: 12, paddingBottom: 4 },
  searchBar: { borderRadius: 10, elevation: 1, backgroundColor: '#fff' },
  searchInput: { fontSize: 14 },
  dropdown: {
    backgroundColor: '#fff',
    marginHorizontal: 12,
    borderRadius: 10,
    elevation: 4,
    maxHeight: 280,
    zIndex: 100,
  },
  empty: { flex: 1, alignItems: 'center', padding: 40 },
  emptyText: { color: COLORS.textSecondary, fontSize: 15 },
  section: { marginHorizontal: 12, marginTop: 12 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: COLORS.textSecondary, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  textInput: { backgroundColor: '#fff' },
  paymentRow: { flexDirection: 'row', gap: 8 },
  payBtn: {
    flex: 1,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  payBtnActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryLight },
  payBtnText: { fontSize: 13, color: COLORS.textSecondary, fontWeight: '600' },
  payBtnTextActive: { color: COLORS.primary },
  actions: { margin: 12, marginTop: 16 },
});
