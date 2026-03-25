import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { Text, Divider, Chip } from 'react-native-paper';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppButton } from '../../src/components/AppButton';
import { SummaryCard } from '../../src/components/SummaryCard';
import { getBillById, deleteBill } from '../../src/db/billRepo';
import { useSettingsStore } from '../../src/store/useSettingsStore';
import { generatePDF } from '../../src/services/invoiceService';
import { sharePDF, shareOnWhatsApp } from '../../src/services/shareService';
import { Bill, BillItem } from '../../src/types/bill';
import { formatDate } from '../../src/utils/date';
import { formatINR } from '../../src/utils/currency';
import { COLORS } from '../../src/constants/paymentModes';

export default function BillDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { settings } = useSettingsStore();

  const [bill, setBill] = useState<(Bill & { items: BillItem[] }) | null>(null);
  const [sharing, setSharing] = useState(false);
  const [whatsapping, setWhatsapping] = useState(false);

  useEffect(() => {
    if (!id) return;
    getBillById(Number(id)).then(setBill);
  }, [id]);

  const handleShare = async () => {
    if (!bill || !settings) return;
    setSharing(true);
    try {
      const uri = await generatePDF(bill, bill.items, settings);
      await sharePDF(uri);
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Failed to share bill.');
    } finally {
      setSharing(false);
    }
  };

  const handleWhatsApp = async () => {
    if (!bill || !settings) return;
    setWhatsapping(true);
    try {
      const uri = await generatePDF(bill, bill.items, settings);
      await shareOnWhatsApp(uri, bill, settings);
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Failed to open WhatsApp.');
    } finally {
      setWhatsapping(false);
    }
  };

  const handleDelete = () => {
    Alert.alert('Delete Bill', `Delete bill ${bill?.bill_number}? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteBill(Number(id));
          router.back();
        },
      },
    ]);
  };

  if (!bill) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.billNo}>{bill.bill_number}</Text>
            <Text style={styles.date}>{formatDate(bill.created_at)}</Text>
          </View>
          <Chip style={styles.payChip} textStyle={styles.payText}>{bill.payment_mode}</Chip>
        </View>

        {bill.customer_name ? (
          <View style={styles.customer}>
            <Text style={styles.customerText}>👤 {bill.customer_name}</Text>
            {bill.customer_phone ? <Text style={styles.customerText}>📞 {bill.customer_phone}</Text> : null}
          </View>
        ) : null}

        <Divider style={styles.divider} />

        {/* Items */}
        <Text style={styles.sectionTitle}>Items</Text>
        {bill.items.map((item, i) => (
          <View key={item.id ?? i} style={styles.itemRow}>
            <View style={styles.itemLeft}>
              <Text style={styles.itemName}>{item.medicine_name}</Text>
              {item.batch_no ? <Text style={styles.itemMeta}>Batch: {item.batch_no}</Text> : null}
              <Text style={styles.itemMeta}>
                {formatINR(item.unit_price)} × {item.qty}
                {item.gst_percent > 0 ? ` · GST ${item.gst_percent}%` : ''}
              </Text>
            </View>
            <Text style={styles.itemTotal}>{formatINR(item.line_total)}</Text>
          </View>
        ))}

        <SummaryCard
          subtotal={bill.subtotal}
          gstTotal={bill.gst_total}
          discountTotal={bill.discount_total}
          grandTotal={bill.grand_total}
        />

        <View style={styles.actions}>
          <AppButton
            label={whatsapping ? 'Opening WhatsApp...' : '💬 Send on WhatsApp'}
            onPress={handleWhatsApp}
            loading={whatsapping}
            style={{ marginBottom: 8 }}
          />
          <AppButton
            label={sharing ? 'Sharing...' : '📤 Share PDF'}
            onPress={handleShare}
            loading={sharing}
            variant="outline"
            style={{ marginBottom: 8 }}
          />
          <AppButton
            label="Delete Bill"
            onPress={handleDelete}
            variant="danger"
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  scroll: { padding: 16, paddingBottom: 32 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  billNo: { fontSize: 22, fontWeight: '800', color: COLORS.primary },
  date: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
  payChip: { backgroundColor: COLORS.primaryLight },
  payText: { fontSize: 12, color: COLORS.primary },
  customer: { marginBottom: 12 },
  customerText: { fontSize: 14, color: COLORS.textSecondary },
  divider: { marginVertical: 12 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: COLORS.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 6,
    elevation: 1,
  },
  itemLeft: { flex: 1, marginRight: 8 },
  itemName: { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary },
  itemMeta: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  itemTotal: { fontSize: 15, fontWeight: '700', color: COLORS.primary },
  actions: { marginTop: 8 },
});
