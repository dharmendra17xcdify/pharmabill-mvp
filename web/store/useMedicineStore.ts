'use client';
import { create } from 'zustand';
import { Medicine } from '@/types/medicine';

interface MedicineStore {
  medicines: Medicine[];
  isLoading: boolean;
  loadMedicines: () => Promise<void>;
  searchMedicines: (query: string) => Medicine[];
  addMedicine: (medicine: Omit<Medicine, 'id'>) => Promise<void>;
  updateMedicine: (medicine: Medicine) => Promise<void>;
  deleteMedicine: (id: number) => Promise<void>;
}

export const useMedicineStore = create<MedicineStore>((set, get) => ({
  medicines: [],
  isLoading: false,

  loadMedicines: async () => {
    set({ isLoading: true });
    const res = await fetch('/api/medicines');
    const data = await res.json();
    set({ medicines: Array.isArray(data) ? data : [], isLoading: false });
  },

  searchMedicines: (query: string) => {
    if (!query.trim()) return get().medicines;
    const q = query.toLowerCase();
    return get().medicines.filter(
      m =>
        m.name.toLowerCase().includes(q) ||
        m.generic_name.toLowerCase().includes(q)
    );
  },

  addMedicine: async (medicine: Omit<Medicine, 'id'>) => {
    await fetch('/api/medicines', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(medicine),
    });
    await get().loadMedicines();
  },

  updateMedicine: async (medicine: Medicine) => {
    await fetch(`/api/medicines/${medicine.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(medicine),
    });
    await get().loadMedicines();
  },

  deleteMedicine: async (id: number) => {
    await fetch(`/api/medicines/${id}`, { method: 'DELETE' });
    await get().loadMedicines();
  },
}));
