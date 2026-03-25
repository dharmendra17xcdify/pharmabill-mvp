import { getPool, sql } from './db';
import { Medicine } from '@/types/medicine';
import dayjs from 'dayjs';

export async function getAllMedicines(): Promise<Medicine[]> {
  const pool = await getPool();
  const result = await pool.request().query(
    `SELECT * FROM medicines ORDER BY name ASC`
  );
  return result.recordset;
}

export async function searchMedicines(query: string): Promise<Medicine[]> {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('q', sql.NVarChar(255), `%${query}%`)
    .query(
      `SELECT * FROM medicines WHERE name LIKE @q OR generic_name LIKE @q ORDER BY name ASC`
    );
  return result.recordset;
}

export async function getMedicineById(id: number): Promise<Medicine | null> {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('id', sql.Int, id)
    .query(`SELECT * FROM medicines WHERE id = @id`);
  return result.recordset[0] ?? null;
}

export async function insertMedicine(medicine: Omit<Medicine, 'id'>): Promise<number> {
  const pool = await getPool();
  const now = dayjs().toISOString();
  const result = await pool
    .request()
    .input('name', sql.NVarChar(255), medicine.name)
    .input('generic_name', sql.NVarChar(255), medicine.generic_name || '')
    .input('batch_no', sql.NVarChar(100), medicine.batch_no || '')
    .input('expiry_month', sql.Int, medicine.expiry_month ?? null)
    .input('expiry_year', sql.Int, medicine.expiry_year ?? null)
    .input('mrp', sql.Decimal(10, 2), medicine.mrp)
    .input('selling_price', sql.Decimal(10, 2), medicine.selling_price)
    .input('gst_percent', sql.Decimal(5, 2), medicine.gst_percent)
    .input('stock_qty', sql.Int, medicine.stock_qty)
    .input('created_at', sql.NVarChar(50), now)
    .input('updated_at', sql.NVarChar(50), now)
    .query(`
      INSERT INTO medicines
        (name, generic_name, batch_no, expiry_month, expiry_year, mrp, selling_price, gst_percent, stock_qty, created_at, updated_at)
      OUTPUT INSERTED.id
      VALUES
        (@name, @generic_name, @batch_no, @expiry_month, @expiry_year, @mrp, @selling_price, @gst_percent, @stock_qty, @created_at, @updated_at)
    `);
  return result.recordset[0].id;
}

export async function updateMedicine(medicine: Medicine): Promise<void> {
  const pool = await getPool();
  const now = dayjs().toISOString();
  await pool
    .request()
    .input('id', sql.Int, medicine.id)
    .input('name', sql.NVarChar(255), medicine.name)
    .input('generic_name', sql.NVarChar(255), medicine.generic_name || '')
    .input('batch_no', sql.NVarChar(100), medicine.batch_no || '')
    .input('expiry_month', sql.Int, medicine.expiry_month ?? null)
    .input('expiry_year', sql.Int, medicine.expiry_year ?? null)
    .input('mrp', sql.Decimal(10, 2), medicine.mrp)
    .input('selling_price', sql.Decimal(10, 2), medicine.selling_price)
    .input('gst_percent', sql.Decimal(5, 2), medicine.gst_percent)
    .input('stock_qty', sql.Int, medicine.stock_qty)
    .input('updated_at', sql.NVarChar(50), now)
    .query(`
      UPDATE medicines SET
        name = @name, generic_name = @generic_name, batch_no = @batch_no,
        expiry_month = @expiry_month, expiry_year = @expiry_year,
        mrp = @mrp, selling_price = @selling_price, gst_percent = @gst_percent,
        stock_qty = @stock_qty, updated_at = @updated_at
      WHERE id = @id
    `);
}

export async function deleteMedicine(id: number): Promise<void> {
  const pool = await getPool();
  await pool.request().input('id', sql.Int, id).query(`DELETE FROM medicines WHERE id = @id`);
}

export async function deductStock(
  request: import('mssql').Request,
  id: number,
  qty: number
): Promise<void> {
  await request
    .input(`stock_id_${id}`, sql.Int, id)
    .input(`stock_qty_${id}`, sql.Int, qty)
    .query(`
      UPDATE medicines
      SET stock_qty = CASE WHEN stock_qty - @stock_qty_${id} < 0 THEN 0 ELSE stock_qty - @stock_qty_${id} END
      WHERE id = @stock_id_${id}
    `);
}
