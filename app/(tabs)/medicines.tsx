import React, { useState, useCallback } from 'react';
import { View, FlatList, StyleSheet, Alert } from 'react-native';
import { Text, FAB, Searchbar } from 'react-native-paper';
import { useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MedicineCard } from '../../src/components/MedicineCard';
import { useMedicineStore } from '../../src/store/useMedicineStore';
import { Medicine } from '../../src/types/medicine';
import { COLORS } from '../../src/constants/paymentModes';

export default function MedicinesScreen() {
  const router = useRouter();
  const { medicines, loadMedicines, deleteMedicine } = useMedicineStore();
  const [search, setSearch] = useState('');

  useFocusEffect(
    useCallback(() => { loadMedicines(); }, [])
  );

  const filtered = search.trim()
    ? medicines.filter(
        (m) =>
          m.name.toLowerCase().includes(search.toLowerCase()) ||
          (m.generic_name?.toLowerCase().includes(search.toLowerCase()) ?? false)
      )
    : medicines;

  const handleDelete = (medicine: Medicine) => {
    Alert.alert('Delete Medicine', `Delete "${medicine.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => { await deleteMedicine(medicine.id!); },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <Searchbar
        placeholder="Search medicines..."
        value={search}
        onChangeText={setSearch}
        style={styles.searchBar}
        inputStyle={styles.searchInput}
      />
      <FlatList
        data={filtered}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <MedicineCard
            medicine={item}
            onPress={() => router.push(`/medicine/${item.id}`)}
            onLongPress={() => handleDelete(item)}
          />
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>
              {search ? 'No medicines found' : 'No medicines yet.\nTap + to add your first medicine.'}
            </Text>
          </View>
        }
        contentContainerStyle={{ paddingBottom: 100, paddingTop: 8 }}
      />
      <FAB
        icon="plus"
        style={styles.fab}
        color="#fff"
        onPress={() => router.push('/medicine/add')}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  searchBar: { margin: 12, borderRadius: 10, elevation: 1, backgroundColor: '#fff' },
  searchInput: { fontSize: 14 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  emptyText: { color: COLORS.textSecondary, textAlign: 'center', fontSize: 15, lineHeight: 22 },
  fab: { position: 'absolute', right: 16, bottom: 24, backgroundColor: COLORS.primary },
});
