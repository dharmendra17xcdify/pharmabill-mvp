import { create } from 'zustand';
import { StoreSettings } from '../types/settings';
import { getSettings, saveSettings as dbSaveSettings } from '../db/settingsRepo';

interface SettingsStore {
  settings: StoreSettings | null;
  loadSettings: () => Promise<void>;
  saveSettings: (data: StoreSettings) => Promise<void>;
}

export const useSettingsStore = create<SettingsStore>((set) => ({
  settings: null,

  loadSettings: async () => {
    const data = await getSettings();
    set({ settings: data });
  },

  saveSettings: async (data: StoreSettings) => {
    await dbSaveSettings(data);
    set({ settings: data });
  },
}));
