import React, { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, RefreshControl } from 'react-native';
import { Text } from 'react-native-paper';
import { useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSettingsStore } from '../../src/store/useSettingsStore';
import { getDashboardStats, DashboardStats } from '../../src/services/reportService';
import { formatINR } from '../../src/utils/currency';
import { COLORS } from '../../src/constants/paymentModes';

export default function DashboardScreen() {
  const { settings } = useSettingsStore();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats>({
    todayTotal: 0, todayCount: 0, monthTotal: 0, monthCount: 0, lowStockCount: 0,
  });
  const [refreshing, setRefreshing] = useState(false);

  const loadStats = async () => {
    const s = await getDashboardStats();
    setStats(s);
  };

  useFocusEffect(
    React.useCallback(() => { loadStats(); }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadStats();
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <View style={styles.topBar}>
        <View>
          <Text style={styles.storeName}>{settings?.store_name ?? 'PharmaBill'}</Text>
          {settings?.owner_name ? <Text style={styles.ownerName}>{settings.owner_name}</Text> : null}
        </View>
        <Text style={styles.appTag}>💊 MVP</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Stats Row */}
        <View style={styles.statsRow}>
          <StatCard label="Today Sales" value={formatINR(stats.todayTotal)} sub={`${stats.todayCount} bills`} />
          <StatCard label="This Month" value={formatINR(stats.monthTotal)} sub={`${stats.monthCount} bills`} />
          <StatCard label="Low Stock" value={String(stats.lowStockCount)} sub="medicines" accent={stats.lowStockCount > 0 ? COLORS.warning : undefined} />
        </View>

        {/* Action Cards */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.grid}>
          <ActionCard icon="🧾" label="New Bill" color="#E3F2FD" onPress={() => router.push('/billing/new')} />
          <ActionCard icon="💊" label="Medicines" color="#E8F5E9" onPress={() => router.push('/(tabs)/medicines')} />
          <ActionCard icon="📋" label="Bills History" color="#FFF8E1" onPress={() => router.push('/(tabs)/bills')} />
          <ActionCard icon="📊" label="Reports" color="#FCE4EC" onPress={() => router.push('/(tabs)/reports')} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function StatCard({ label, value, sub, accent }: { label: string; value: string; sub: string; accent?: string }) {
  return (
    <View style={styles.statCard}>
      <Text style={[styles.statValue, accent ? { color: accent } : {}]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statSub}>{sub}</Text>
    </View>
  );
}

function ActionCard({ icon, label, color, onPress }: { icon: string; label: string; color: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={[styles.actionCard, { backgroundColor: color }]} onPress={onPress} activeOpacity={0.7}>
      <Text style={styles.actionIcon}>{icon}</Text>
      <Text style={styles.actionLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  topBar: { backgroundColor: COLORS.primary, padding: 16, paddingTop: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  storeName: { color: '#fff', fontSize: 20, fontWeight: '800' },
  ownerName: { color: '#BBDEFB', fontSize: 13 },
  appTag: { color: '#BBDEFB', fontSize: 13 },
  scroll: { padding: 16, paddingBottom: 24 },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  statCard: { flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 12, alignItems: 'center', elevation: 2 },
  statValue: { fontSize: 18, fontWeight: '800', color: COLORS.primary },
  statLabel: { fontSize: 11, color: COLORS.textSecondary, marginTop: 2, textAlign: 'center' },
  statSub: { fontSize: 11, color: COLORS.textSecondary },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  actionCard: { width: '47%', borderRadius: 14, padding: 20, alignItems: 'center', elevation: 1 },
  actionIcon: { fontSize: 36, marginBottom: 8 },
  actionLabel: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary },
});
