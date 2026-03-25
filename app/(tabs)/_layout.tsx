import React from 'react';
import { Tabs } from 'expo-router';
import { COLORS } from '../../src/constants/paymentModes';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: '#9E9E9E',
        tabBarStyle: { backgroundColor: '#fff', borderTopColor: COLORS.border },
        headerStyle: { backgroundColor: COLORS.primary },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: '700' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: 'Dashboard', tabBarLabel: 'Home', tabBarIcon: ({ color }) => <TabIcon icon="🏠" color={color} /> }}
      />
      <Tabs.Screen
        name="medicines"
        options={{ title: 'Medicines', tabBarLabel: 'Medicines', tabBarIcon: ({ color }) => <TabIcon icon="💊" color={color} /> }}
      />
      <Tabs.Screen
        name="bills"
        options={{ title: 'Bills History', tabBarLabel: 'Bills', tabBarIcon: ({ color }) => <TabIcon icon="🧾" color={color} /> }}
      />
      <Tabs.Screen
        name="reports"
        options={{ title: 'Reports', tabBarLabel: 'Reports', tabBarIcon: ({ color }) => <TabIcon icon="📊" color={color} /> }}
      />
      <Tabs.Screen
        name="settings"
        options={{ title: 'Settings', tabBarLabel: 'Settings', tabBarIcon: ({ color }) => <TabIcon icon="⚙️" color={color} /> }}
      />
    </Tabs>
  );
}

function TabIcon({ icon, color }: { icon: string; color: string }) {
  const { Text } = require('react-native');
  return <Text style={{ fontSize: 20 }}>{icon}</Text>;
}
