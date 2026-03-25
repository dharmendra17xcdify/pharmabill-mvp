import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { initDb } from '../src/db';
import { useSettingsStore } from '../src/store/useSettingsStore';
import { COLORS } from '../src/constants/paymentModes';

export default function RootLayout() {
  const [dbReady, setDbReady] = useState(false);
  const { settings, loadSettings } = useSettingsStore();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    async function bootstrap() {
      await initDb();
      await loadSettings();
      setDbReady(true);
    }
    bootstrap().catch(console.error);
  }, []);

  useEffect(() => {
    if (!dbReady) return;
    const inSetup = segments[0] === 'setup';
    if (!settings && !inSetup) {
      router.replace('/setup');
    } else if (settings && inSetup) {
      router.replace('/(tabs)');
    }
  }, [dbReady, settings, segments]);

  if (!dbReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.primary }}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <PaperProvider>
        <StatusBar style="light" />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="setup" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="medicine/add" options={{ headerShown: true, title: 'Add Medicine', headerStyle: { backgroundColor: COLORS.primary }, headerTintColor: '#fff' }} />
          <Stack.Screen name="medicine/[id]" options={{ headerShown: true, title: 'Edit Medicine', headerStyle: { backgroundColor: COLORS.primary }, headerTintColor: '#fff' }} />
          <Stack.Screen name="billing/new" options={{ headerShown: true, title: 'New Bill', headerStyle: { backgroundColor: COLORS.primary }, headerTintColor: '#fff' }} />
          <Stack.Screen name="billing/preview" options={{ headerShown: true, title: 'Invoice Preview', headerStyle: { backgroundColor: COLORS.primary }, headerTintColor: '#fff' }} />
          <Stack.Screen name="bill/[id]" options={{ headerShown: true, title: 'Bill Detail', headerStyle: { backgroundColor: COLORS.primary }, headerTintColor: '#fff' }} />
        </Stack>
      </PaperProvider>
    </SafeAreaProvider>
  );
}
