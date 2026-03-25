'use client';
import { create } from 'zustand';
import { StoreSettings } from '@/types/settings';

interface SettingsStore {
  settings: StoreSettings | null;
  isLoaded: boolean;
  loadSettings: () => Promise<void>;
  saveSettings: (s: StoreSettings) => Promise<void>;
}

export const useSettingsStore = create<SettingsStore>((set) => ({
  settings: null,
  isLoaded: false,

  loadSettings: async () => {
    const res = await fetch('/api/settings');
    const data = await res.json();
    set({ settings: data.settings ?? null, isLoaded: true });
  },

  saveSettings: async (settings: StoreSettings) => {
    const res = await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    });
    if (!res.ok) throw new Error('Failed to save settings');
    set({ settings });
  },
}));
