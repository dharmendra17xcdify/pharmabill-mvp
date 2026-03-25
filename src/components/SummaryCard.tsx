import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Divider } from 'react-native-paper';
import { COLORS } from '../constants/paymentModes';
import { formatINR } from '../utils/currency';

interface Props {
  subtotal: number;
  gstTotal: number;
  discountTotal?: number;
  grandTotal: number;
}

export function SummaryCard({ subtotal, gstTotal, discountTotal = 0, grandTotal }: Props) {
  return (
    <View style={styles.card}>
      <Row label="Subtotal (taxable)" value={formatINR(subtotal)} />
      <Row label="GST Total" value={formatINR(gstTotal)} />
      {discountTotal > 0 ? (
        <Row label="Discount" value={`− ${formatINR(discountTotal)}`} valueColor={COLORS.success} />
      ) : null}
      <Divider style={styles.divider} />
      <Row label="Grand Total" value={formatINR(grandTotal)} bold />
    </View>
  );
}

function Row({
  label,
  value,
  bold,
  valueColor,
}: {
  label: string;
  value: string;
  bold?: boolean;
  valueColor?: string;
}) {
  return (
    <View style={styles.row}>
      <Text style={[styles.label, bold && styles.bold]}>{label}</Text>
      <Text style={[styles.value, bold && styles.bold, valueColor ? { color: valueColor } : {}]}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 14,
    marginHorizontal: 12,
    marginVertical: 8,
    elevation: 2,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  label: { fontSize: 14, color: COLORS.textSecondary },
  value: { fontSize: 14, color: COLORS.textPrimary },
  bold: { fontWeight: '700', fontSize: 16, color: COLORS.primary },
  divider: { marginVertical: 6 },
});
