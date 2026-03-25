import { NextResponse } from 'next/server';
import { getTodayStats, getMonthStats } from '@/lib/billRepo';
import { getAllMedicines } from '@/lib/medicineRepo';
import { LOW_STOCK_THRESHOLD } from '@/constants/paymentModes';

export async function GET() {
  try {
    const [todayStats, monthStats, allMedicines] = await Promise.all([
      getTodayStats(),
      getMonthStats(),
      getAllMedicines(),
    ]);

    const lowStock = allMedicines.filter(m => m.stock_qty <= LOW_STOCK_THRESHOLD);

    return NextResponse.json({
      today: todayStats,
      month: monthStats,
      lowStockCount: lowStock.length,
      lowStockMedicines: lowStock,
    });
  } catch (err) {
    console.error('GET /api/reports', err);
    return NextResponse.json({ error: 'Failed to load reports' }, { status: 500 });
  }
}
