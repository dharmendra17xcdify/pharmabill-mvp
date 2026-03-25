import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, IconButton } from 'react-native-paper';
import { CartItem } from '../types/bill';
import { COLORS } from '../constants/paymentModes';
import { formatINR } from '../utils/currency';

interface Props {
  item: CartItem;
  onRemove: (medicineId: number) => void;
  onQtyChange: (medicineId: number, qty: number) => void;
}

export function CartItemRow({ item, onRemove, onQtyChange }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.name} numberOfLines={1}>
          {item.medicine_name}
        </Text>
        <TouchableOpacity onPress={() => onRemove(item.medicine_id)}>
          <Text style={styles.remove}>✕</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.row}>
        <View style={styles.qtyControl}>
          <TouchableOpacity
            style={styles.qtyBtn}
            onPress={() => onQtyChange(item.medicine_id, item.qty - 1)}
          >
            <Text style={styles.qtyBtnText}>−</Text>
          </TouchableOpacity>
          <Text style={styles.qty}>{item.qty}</Text>
          <TouchableOpacity
            style={styles.qtyBtn}
            onPress={() => onQtyChange(item.medicine_id, item.qty + 1)}
          >
            <Text style={styles.qtyBtnText}>+</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.priceInfo}>
          <Text style={styles.unitPrice}>
            {formatINR(item.unit_price)} × {item.qty}
          </Text>
          {item.gst_percent > 0 ? (
            <Text style={styles.gstText}>
              GST {item.gst_percent}%: {formatINR(item.gst_amount)}
            </Text>
          ) : null}
          <Text style={styles.lineTotal}>{formatINR(item.line_total)}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    marginHorizontal: 12,
    marginVertical: 4,
    elevation: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  name: { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary, flex: 1, marginRight: 8 },
  remove: { fontSize: 16, color: COLORS.danger, fontWeight: 'bold', padding: 4 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  qtyControl: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  qtyBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyBtnText: { fontSize: 18, color: COLORS.primary, fontWeight: 'bold', lineHeight: 22 },
  qty: { fontSize: 16, fontWeight: '700', minWidth: 28, textAlign: 'center', color: COLORS.textPrimary },
  priceInfo: { alignItems: 'flex-end' },
  unitPrice: { fontSize: 12, color: COLORS.textSecondary },
  gstText: { fontSize: 11, color: COLORS.textSecondary },
  lineTotal: { fontSize: 15, fontWeight: '700', color: COLORS.primary, marginTop: 2 },
});
