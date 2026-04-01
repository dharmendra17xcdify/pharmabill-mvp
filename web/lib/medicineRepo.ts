import { getPool, sql } from './db';
import { Medicine, MedicineBatch } from '@/types/medicine';
import dayjs from 'dayjs';

// ── Shared SQL fragment ───────────────────────────────────────────────────────

const MEDICINE_BATCH_SELECT = `
  SELECT
    m.id,
    m.name, m.generic_name, m.gst_percent,
    m.packing, m.packing_qty, m.hsn,
    m.manufacture_name, m.[group],
    m.created_at, m.updated_at,
    mb.id              AS batch_id,
    ISNULL(mb.batch_no,      '')  AS batch_no,
    mb.expiry_month,
    mb.expiry_year,
    ISNULL(mb.mrp,           0)   AS mrp,
    ISNULL(mb.selling_price, 0)   AS selling_price,
    ISNULL(mb.rate,          0)   AS rate,
    ISNULL(mb.discount,      0)   AS discount,
    ISNULL(mb.stock_qty,     0)   AS stock_qty
  FROM medicines m
  LEFT JOIN medicine_batches mb ON mb.medicine_id = m.id
`;

// ── Read operations ───────────────────────────────────────────────────────────

/**
 * Returns one row per batch (or one row per medicine if no batches exist).
 * Ordered by name then earliest expiry first (FIFO).
 */
export async function getAllMedicines(): Promise<Medicine[]> {
  const pool = await getPool();
  const result = await pool.request().query(
    `${MEDICINE_BATCH_SELECT} ORDER BY m.name ASC, mb.expiry_year ASC, mb.expiry_month ASC`
  );
  return result.recordset;
}

export async function searchMedicines(query: string): Promise<Medicine[]> {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('q', sql.NVarChar(255), `%${query}%`)
    .query(`
      ${MEDICINE_BATCH_SELECT}
      WHERE m.name LIKE @q OR m.generic_name LIKE @q
      ORDER BY m.name ASC, mb.expiry_year ASC, mb.expiry_month ASC
    `);
  return result.recordset;
}

/** Returns the medicine catalogue row joined with its first (FIFO) batch. */
export async function getMedicineById(id: number): Promise<Medicine | null> {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('id', sql.Int, id)
    .query(`
      ${MEDICINE_BATCH_SELECT}
      WHERE m.id = @id
      ORDER BY mb.expiry_year ASC, mb.expiry_month ASC
    `);
  return result.recordset[0] ?? null;
}

/** Returns all batches for a given medicine, oldest expiry first. */
export async function getBatchesByMedicineId(medicineId: number): Promise<MedicineBatch[]> {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('medicine_id', sql.Int, medicineId)
    .query(`
      SELECT * FROM medicine_batches
      WHERE medicine_id = @medicine_id
      ORDER BY expiry_year ASC, expiry_month ASC
    `);
  return result.recordset;
}

// ── Write operations ──────────────────────────────────────────────────────────

/**
 * Inserts a new medicine into the catalogue and, if price/stock data is
 * provided, creates its first batch in medicine_batches.
 */
export async function insertMedicine(medicine: Omit<Medicine, 'id' | 'batch_id'>): Promise<number> {
  const pool = await getPool();
  const now = dayjs().toISOString();
  const transaction = new sql.Transaction(pool);
  await transaction.begin();

  try {
    // 1. Insert catalogue row (legacy columns kept for backward compat)
    const result = await new sql.Request(transaction)
      .input('name',             sql.NVarChar(255), medicine.name)
      .input('generic_name',     sql.NVarChar(255), medicine.generic_name || '')
      .input('gst_percent',      sql.Decimal(5, 2), medicine.gst_percent)
      .input('packing',          sql.NVarChar(100), medicine.packing || '')
      .input('packing_qty',      sql.Int,           medicine.packing_qty ?? 1)
      .input('hsn',              sql.NVarChar(50),  medicine.hsn || '')
      .input('manufacture_name', sql.NVarChar(255), medicine.manufacture_name || '')
      .input('group',            sql.NVarChar(100), medicine.group || '')
      .input('created_at',       sql.NVarChar(50),  now)
      .input('updated_at',       sql.NVarChar(50),  now)
      // legacy batch columns — kept so existing INSERT schema stays valid
      .input('batch_no',         sql.NVarChar(100), medicine.batch_no || '')
      .input('expiry_month',     sql.Int,           medicine.expiry_month ?? null)
      .input('expiry_year',      sql.Int,           medicine.expiry_year ?? null)
      .input('mrp',              sql.Decimal(10, 2), medicine.mrp || 0)
      .input('selling_price',    sql.Decimal(10, 2), medicine.selling_price || 0)
      .input('rate',             sql.Decimal(10, 2), medicine.rate ?? 0)
      .input('discount',         sql.Decimal(5, 2),  medicine.discount ?? 0)
      .input('stock_qty',        sql.Int,            medicine.stock_qty ?? 0)
      .query(`
        INSERT INTO medicines
          (name, generic_name, batch_no, expiry_month, expiry_year, mrp, selling_price,
           gst_percent, stock_qty, packing, packing_qty, hsn, rate, discount,
           manufacture_name, [group], created_at, updated_at)
        OUTPUT INSERTED.id
        VALUES
          (@name, @generic_name, @batch_no, @expiry_month, @expiry_year, @mrp, @selling_price,
           @gst_percent, @stock_qty, @packing, @packing_qty, @hsn, @rate, @discount,
           @manufacture_name, @group, @created_at, @updated_at)
      `);

    const medicineId: number = result.recordset[0].id;

    // 2. Create first batch when price or stock data is present
    if ((medicine.mrp || 0) > 0 || (medicine.selling_price || 0) > 0 || (medicine.stock_qty || 0) > 0) {
      await new sql.Request(transaction)
        .input('medicine_id',   sql.Int,            medicineId)
        .input('batch_no',      sql.NVarChar(100),  medicine.batch_no || '')
        .input('expiry_month',  sql.Int,            medicine.expiry_month ?? null)
        .input('expiry_year',   sql.Int,            medicine.expiry_year ?? null)
        .input('mrp',           sql.Decimal(10, 2), medicine.mrp || 0)
        .input('selling_price', sql.Decimal(10, 2), medicine.selling_price || 0)
        .input('rate',          sql.Decimal(10, 2), medicine.rate ?? 0)
        .input('discount',      sql.Decimal(5, 2),  medicine.discount ?? 0)
        .input('stock_qty',     sql.Int,            medicine.stock_qty ?? 0)
        .input('created_at',    sql.NVarChar(50),   now)
        .query(`
          INSERT INTO medicine_batches
            (medicine_id, batch_no, expiry_month, expiry_year, mrp, selling_price, rate, discount, stock_qty, created_at)
          VALUES
            (@medicine_id, @batch_no, @expiry_month, @expiry_year, @mrp, @selling_price, @rate, @discount, @stock_qty, @created_at)
        `);
    }

    await transaction.commit();
    return medicineId;
  } catch (err) {
    await transaction.rollback();
    throw err;
  }
}

/**
 * Updates medicine catalogue fields and, if batch_id is supplied, also
 * updates the specific batch record.
 */
export async function updateMedicine(medicine: Medicine): Promise<void> {
  const pool = await getPool();
  const now = dayjs().toISOString();
  const transaction = new sql.Transaction(pool);
  await transaction.begin();

  try {
    // Update catalogue (batch-agnostic fields only)
    await new sql.Request(transaction)
      .input('id',               sql.Int,            medicine.id)
      .input('name',             sql.NVarChar(255),  medicine.name)
      .input('generic_name',     sql.NVarChar(255),  medicine.generic_name || '')
      .input('gst_percent',      sql.Decimal(5, 2),  medicine.gst_percent)
      .input('packing',          sql.NVarChar(100),  medicine.packing || '')
      .input('packing_qty',      sql.Int,            medicine.packing_qty ?? 1)
      .input('hsn',              sql.NVarChar(50),   medicine.hsn || '')
      .input('manufacture_name', sql.NVarChar(255),  medicine.manufacture_name || '')
      .input('group',            sql.NVarChar(100),  medicine.group || '')
      .input('updated_at',       sql.NVarChar(50),   now)
      .query(`
        UPDATE medicines SET
          name = @name, generic_name = @generic_name, gst_percent = @gst_percent,
          packing = @packing, packing_qty = @packing_qty, hsn = @hsn,
          manufacture_name = @manufacture_name, [group] = @group, updated_at = @updated_at
        WHERE id = @id
      `);

    // Update the specific batch if batch_id is provided
    if (medicine.batch_id) {
      await new sql.Request(transaction)
        .input('batch_id',      sql.Int,            medicine.batch_id)
        .input('batch_no',      sql.NVarChar(100),  medicine.batch_no || '')
        .input('expiry_month',  sql.Int,            medicine.expiry_month ?? null)
        .input('expiry_year',   sql.Int,            medicine.expiry_year ?? null)
        .input('mrp',           sql.Decimal(10, 2), medicine.mrp || 0)
        .input('selling_price', sql.Decimal(10, 2), medicine.selling_price || 0)
        .input('rate',          sql.Decimal(10, 2), medicine.rate ?? 0)
        .input('discount',      sql.Decimal(5, 2),  medicine.discount ?? 0)
        .input('stock_qty',     sql.Int,            medicine.stock_qty ?? 0)
        .query(`
          UPDATE medicine_batches SET
            batch_no = @batch_no, expiry_month = @expiry_month, expiry_year = @expiry_year,
            mrp = @mrp, selling_price = @selling_price, rate = @rate,
            discount = @discount, stock_qty = @stock_qty
          WHERE id = @batch_id
        `);
    }

    await transaction.commit();
  } catch (err) {
    await transaction.rollback();
    throw err;
  }
}

/**
 * Deletes a medicine and all its batches (ON DELETE CASCADE handles batches).
 */
export async function deleteMedicine(id: number): Promise<void> {
  const pool = await getPool();
  await pool.request().input('id', sql.Int, id).query(`DELETE FROM medicines WHERE id = @id`);
}

/**
 * Deletes a single batch record. The medicine catalogue entry is preserved.
 */
export async function deleteBatch(batchId: number): Promise<void> {
  const pool = await getPool();
  await pool.request().input('id', sql.Int, batchId).query(`DELETE FROM medicine_batches WHERE id = @id`);
}

// ── Stock operations ──────────────────────────────────────────────────────────

/**
 * Deducts qty from the earliest-expiring batch that still has stock (FIFO).
 * Used inside a billing transaction — takes an existing mssql.Request.
 */
export async function deductStock(
  request: import('mssql').Request,
  medicineId: number,
  qty: number
): Promise<void> {
  await request
    .input(`stock_mid_${medicineId}`, sql.Int, medicineId)
    .input(`stock_qty_${medicineId}`, sql.Int, qty)
    .query(`
      UPDATE medicine_batches
      SET stock_qty = CASE
        WHEN stock_qty - @stock_qty_${medicineId} < 0 THEN 0
        ELSE stock_qty - @stock_qty_${medicineId}
      END
      WHERE id = (
        SELECT TOP 1 id
        FROM medicine_batches
        WHERE medicine_id = @stock_mid_${medicineId} AND stock_qty > 0
        ORDER BY expiry_year ASC, expiry_month ASC, id ASC
      )
    `);
}
