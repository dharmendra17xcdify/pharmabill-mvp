import React, { useState, useCallback } from 'react';
import { View, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, Searchbar, Chip } from 'react-native-paper';
import { useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Bill } from '../../src/types/bill';
import { getAllBills } from '../../src/db/billRepo';
import { formatDate } from '../../src/utils/date';
import { formatINR } from '../../src/utils/currency';
import { COLORS } from '../../src/constants/paymentModes';

export default function BillsScreen() {
  const router = useRouter();
  const [bills, setBills] = useState<Bill[]>([]);
  const [search, setSearch] = useState('');

  useFocusEffect(
    useCallback(() => {
      getAllBills().then(setBills);
    }, [])
  );

  const filtered = search.trim()
    ? bills.filter(
        (b) =>
          b.bill_number.toLowerCase().includes(search.toLowerCase()) ||
          (b.customer_name?.toLowerCase().includes(search.toLowerCase()) ?? false)
      )
    : bills;

  const paymentColor = (mode: string) => {
    if (mode === 'Cash') return '#E8F5E9';
    if (mode === 'UPI') return '#E3F2FD';
    return '#FFF3E0';
  };

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <Searchbar
        placeholder="Search by bill no or customer..."
        value={search}
        onChangeText={setSearch}
        style={styles.searchBar}
        inputStyle={styles.searchInput}
      />
      <FlatList
        data={filtered}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => router.push(`/bill/${item.id}`)}
            activeOpacity={0.7}
          >
            <View style={styles.cardTop}>
              <Text style={styles.billNo}>{item.bill_number}</Text>
              <Text style={styles.amount}>{formatINR(item.grand_total)}</Text>
            </View>
            <View style={styles.cardBottom}>
              <Text style={styles.date}>{formatDate(item.created_at)}</Text>
              <Chip
                compact
                style={[styles.payChip, { backgroundColor: paymentColor(item.payment_mode) }]}
                textStyle={styles.payText}
              >
                {item.payment_mode}
              </Chip>
            </View>
            {item.customer_name ? (
              <Text style={styles.customer}>👤 {item.customer_name}</Text>
            ) : null}
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>
              {search ? 'No bills found' : 'No bills yet.\nCreate your first bill!'}
            </Text>
          </View>
        }
        contentContainerStyle={{ paddingBottom: 24, paddingTop: 4 }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  searchBar: { margin: 12, borderRadius: 10, elevation: 1, backgroundColor: '#fff' },
  searchInput: { fontSize: 14 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginHorizontal: 12,
    marginVertical: 4,
    elevation: 1,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  billNo: { fontSize: 16, fontWeight: '700', color: COLORS.primary },
  amount: { fontSize: 17, fontWeight: '800', color: COLORS.textPrimary },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 },
  date: { fontSize: 12, color: COLORS.textSecondary },
  payChip: { height: 24 },
  payText: { fontSize: 11 },
  customer: { fontSize: 12, color: COLORS.textSecondary, marginTop: 4 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  emptyText: { color: COLORS.textSecondary, textAlign: 'center', fontSize: 15, lineHeight: 22 },
});
