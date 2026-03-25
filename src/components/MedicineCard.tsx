import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, Chip } from 'react-native-paper';
import { Medicine } from '../types/medicine';
import { COLORS, LOW_STOCK_THRESHOLD } from '../constants/paymentModes';
import { formatINR } from '../utils/currency';
import { formatExpiry, isExpired } from '../utils/date';

interface Props {
  medicine: Medicine;
  onPress?: () => void;
  onLongPress?: () => void;
  showAddButton?: boolean;
  onAdd?: (medicine: Medicine) => void;
}

export function MedicineCard({ medicine, onPress, onLongPress, showAddButton, onAdd }: Props) {
  const isLowStock = medicine.stock_qty <= LOW_STOCK_THRESHOLD;
  const expired = isExpired(medicine.expiry_month, medicine.expiry_year);
  const expiry = formatExpiry(medicine.expiry_month, medicine.expiry_year);

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.7}
    >
      <View style={styles.row}>
        <View style={styles.info}>
          <Text style={styles.name}>{medicine.name}</Text>
          {medicine.generic_name ? (
            <Text style={styles.generic}>{medicine.generic_name}</Text>
          ) : null}
          <View style={styles.metaRow}>
            <Text style={styles.meta}>MRP: {formatINR(medicine.mrp)}</Text>
            <Text style={styles.meta}> · </Text>
            <Text style={[styles.meta, { color: COLORS.primary }]}>
              SP: {formatINR(medicine.selling_price)}
            </Text>
            {expiry ? (
              <>
                <Text style={styles.meta}> · </Text>
                <Text style={[styles.meta, expired ? { color: COLORS.danger } : {}]}>
                  Exp: {expiry}
                </Text>
              </>
            ) : null}
          </View>
        </View>
        <View style={styles.right}>
          <Chip
            style={[styles.stockChip, isLowStock ? styles.lowStock : styles.okStock]}
            textStyle={styles.stockText}
            compact
          >
            {medicine.stock_qty} units
          </Chip>
          {showAddButton && onAdd ? (
            <TouchableOpacity
              style={styles.addBtn}
              onPress={() => onAdd(medicine)}
            >
              <Text style={styles.addBtnText}>+ Add</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    marginHorizontal: 12,
    marginVertical: 4,
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  row: { flexDirection: 'row', alignItems: 'flex-start' },
  info: { flex: 1 },
  name: { fontSize: 15, fontWeight: '600', color: COLORS.textPrimary },
  generic: { fontSize: 12, color: COLORS.textSecondary, marginTop: 1 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 4 },
  meta: { fontSize: 12, color: COLORS.textSecondary },
  right: { alignItems: 'flex-end', gap: 6 },
  stockChip: { height: 24 },
  lowStock: { backgroundColor: '#FFEBEE' },
  okStock: { backgroundColor: '#E8F5E9' },
  stockText: { fontSize: 11 },
  addBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginTop: 4,
  },
  addBtnText: { color: '#fff', fontSize: 12, fontWeight: '600' },
});
