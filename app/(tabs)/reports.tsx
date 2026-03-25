import React, { useState, useCallback } from 'react';
import { View, FlatList, StyleSheet, ScrollView } from 'react-native';
import { Text } from 'react-native-paper';
import { useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getDashboardStats, getLowStockMedicines, DashboardStats } from '../../src/services/reportService';
import { Medicine } from '../../src/types/medicine';
import { formatINR } from '../../src/utils/currency';
import { formatExpiry } from '../../src/utils/date';
import { COLORS } from '../../src/constants/paymentModes';

export default function ReportsScreen() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [lowStock, setLowStock] = useState<Medicine[]>([]);

  useFocusEffect(
    useCallback(() => {
      getDashboardStats().then(setStats);
      getLowStockMedicines().then(setLowStock);
    }, [])
  );

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.row}>
          <StatBox label="Today Sales" value={stats ? formatINR(stats.todayTotal) : '—'} sub={`${stats?.todayCount ?? 0} bills`} />
          <StatBox label="This Month" value={stats ? formatINR(stats.monthTotal) : '—'} sub={`${stats?.monthCount ?? 0} bills`} />
        </View>

        <View style={[styles.card, { marginTop: 16 }]}>
          <Text style={styles.cardTitle}>🔴 Low Stock Medicines ({lowStock.length})</Text>
          {lowStock.length === 0 ? (
            <Text style={styles.emptyText}>All medicines are well stocked 👍</Text>
          ) : (
            lowStock.map((m) => (
              <View key={m.id} style={styles.stockRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.medicineName}>{m.name}</Text>
                  {m.expiry_month ? (
                    <Text style={styles.expiry}>Exp: {formatExpiry(m.expiry_month, m.expiry_year)}</Text>
                  ) : null}
                </View>
                <View style={[styles.qtyBadge, m.stock_qty === 0 ? styles.qtyZero : styles.qtyLow]}>
                  <Text style={styles.qtyText}>{m.stock_qty} left</Text>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function StatBox({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <View style={styles.statBox}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statSub}>{sub}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  scroll: { padding: 16, paddingBottom: 32 },
  row: { flexDirection: 'row', gap: 12 },
  statBox: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    elevation: 2,
  },
  statValue: { fontSize: 22, fontWeight: '800', color: COLORS.primary },
  statLabel: { fontSize: 13, color: COLORS.textSecondary, marginTop: 4, textAlign: 'center' },
  statSub: { fontSize: 12, color: COLORS.textSecondary },
  card: { backgroundColor: '#fff', borderRadius: 14, padding: 16, elevation: 2 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 12 },
  emptyText: { color: COLORS.textSecondary, textAlign: 'center', padding: 8 },
  stockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  medicineName: { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary },
  expiry: { fontSize: 11, color: COLORS.textSecondary, marginTop: 2 },
  qtyBadge: { borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4 },
  qtyLow: { backgroundColor: '#FFF3E0' },
  qtyZero: { backgroundColor: '#FFEBEE' },
  qtyText: { fontSize: 12, fontWeight: '700', color: COLORS.textPrimary },
});
