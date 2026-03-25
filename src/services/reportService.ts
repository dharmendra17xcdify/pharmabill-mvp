import { getTodayStats, getMonthStats } from '../db/billRepo';
import { getAllMedicines } from '../db/medicineRepo';
import { Medicine } from '../types/medicine';
import { LOW_STOCK_THRESHOLD } from '../constants/paymentModes';

export interface DashboardStats {
  todayTotal: number;
  todayCount: number;
  monthTotal: number;
  monthCount: number;
  lowStockCount: number;
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const [today, month, medicines] = await Promise.all([
    getTodayStats(),
    getMonthStats(),
    getAllMedicines(),
  ]);
  const lowStockCount = medicines.filter(
    (m) => m.stock_qty <= LOW_STOCK_THRESHOLD
  ).length;
  return {
    todayTotal: today.total,
    todayCount: today.count,
    monthTotal: month.total,
    monthCount: month.count,
    lowStockCount,
  };
}

export async function getLowStockMedicines(): Promise<Medicine[]> {
  const medicines = await getAllMedicines();
  return medicines.filter((m) => m.stock_qty <= LOW_STOCK_THRESHOLD);
}
