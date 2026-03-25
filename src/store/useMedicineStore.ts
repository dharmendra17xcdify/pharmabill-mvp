import { create } from 'zustand';
import { Medicine } from '../types/medicine';
import {
  getAllMedicines,
  searchMedicines as dbSearch,
  insertMedicine,
  updateMedicine as dbUpdate,
  deleteMedicine as dbDelete,
} from '../db/medicineRepo';

interface MedicineStore {
  medicines: Medicine[];
  loadMedicines: () => Promise<void>;
  searchMedicines: (query: string) => Promise<Medicine[]>;
  addMedicine: (medicine: Omit<Medicine, 'id'>) => Promise<void>;
  updateMedicine: (medicine: Medicine) => Promise<void>;
  deleteMedicine: (id: number) => Promise<void>;
}

export const useMedicineStore = create<MedicineStore>((set) => ({
  medicines: [],

  loadMedicines: async () => {
    const data = await getAllMedicines();
    set({ medicines: data });
  },

  searchMedicines: async (query: string) => {
    if (!query.trim()) {
      return getAllMedicines();
    }
    return dbSearch(query);
  },

  addMedicine: async (medicine) => {
    await insertMedicine(medicine);
    const data = await getAllMedicines();
    set({ medicines: data });
  },

  updateMedicine: async (medicine) => {
    await dbUpdate(medicine);
    const data = await getAllMedicines();
    set({ medicines: data });
  },

  deleteMedicine: async (id) => {
    await dbDelete(id);
    const data = await getAllMedicines();
    set({ medicines: data });
  },
}));
