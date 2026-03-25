import { Medicine } from '../types/medicine';
import { getDb } from './index';
import dayjs from 'dayjs';

export async function getAllMedicines(): Promise<Medicine[]> {
  const db = getDb();
  return await db.getAllAsync<Medicine>(
    `SELECT * FROM medicines ORDER BY name ASC`
  );
}

export async function searchMedicines(query: string): Promise<Medicine[]> {
  const db = getDb();
  const q = `%${query}%`;
  return await db.getAllAsync<Medicine>(
    `SELECT * FROM medicines WHERE name LIKE ? OR generic_name LIKE ? ORDER BY name ASC`,
    [q, q]
  );
}

export async function getMedicineById(id: number): Promise<Medicine | null> {
  const db = getDb();
  return await db.getFirstAsync<Medicine>(
    `SELECT * FROM medicines WHERE id = ?`,
    [id]
  ) ?? null;
}

export async function insertMedicine(medicine: Omit<Medicine, 'id'>): Promise<number> {
  const db = getDb();
  const now = dayjs().toISOString();
  const result = await db.runAsync(
    `INSERT INTO medicines
      (name, generic_name, batch_no, expiry_month, expiry_year, mrp, selling_price, gst_percent, stock_qty, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      medicine.name,
      medicine.generic_name || '',
      medicine.batch_no || '',
      medicine.expiry_month ?? null,
      medicine.expiry_year ?? null,
      medicine.mrp,
      medicine.selling_price,
      medicine.gst_percent,
      medicine.stock_qty,
      now,
      now,
    ]
  );
  return result.lastInsertRowId;
}

export async function updateMedicine(medicine: Medicine): Promise<void> {
  const db = getDb();
  const now = dayjs().toISOString();
  await db.runAsync(
    `UPDATE medicines SET
      name = ?, generic_name = ?, batch_no = ?, expiry_month = ?, expiry_year = ?,
      mrp = ?, selling_price = ?, gst_percent = ?, stock_qty = ?, updated_at = ?
     WHERE id = ?`,
    [
      medicine.name,
      medicine.generic_name || '',
      medicine.batch_no || '',
      medicine.expiry_month ?? null,
      medicine.expiry_year ?? null,
      medicine.mrp,
      medicine.selling_price,
      medicine.gst_percent,
      medicine.stock_qty,
      now,
      medicine.id!,
    ]
  );
}

export async function deleteMedicine(id: number): Promise<void> {
  const db = getDb();
  await db.runAsync(`DELETE FROM medicines WHERE id = ?`, [id]);
}

export async function deductStock(id: number, qty: number): Promise<void> {
  const db = getDb();
  await db.runAsync(
    `UPDATE medicines SET stock_qty = MAX(0, stock_qty - ?) WHERE id = ?`,
    [qty, id]
  );
}
