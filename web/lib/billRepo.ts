import { getPool, sql } from './db';
import { Bill, BillItem } from '@/types/bill';

export async function getNextInvoiceNumber(prefix: string): Promise<string> {
  const pool = await getPool();
  const result = await pool
    .request()
    .query(`
      UPDATE app_meta
      SET value = CAST(CAST(value AS INT) + 1 AS NVARCHAR(10))
      OUTPUT INSERTED.value
      WHERE [key] = 'last_invoice_number'
    `);
  const next = result.recordset[0].value;
  return `${prefix}-${String(next).padStart(4, '0')}`;
}

export async function saveBill(
  bill: Omit<Bill, 'id'>,
  items: Omit<BillItem, 'id' | 'bill_id'>[]
): Promise<number> {
  const pool = await getPool();
  const transaction = new sql.Transaction(pool);
  await transaction.begin();

  try {
    const billResult = await new sql.Request(transaction)
      .input('bill_number', sql.NVarChar(50), bill.bill_number)
      .input('customer_name', sql.NVarChar(255), bill.customer_name || '')
      .input('customer_phone', sql.NVarChar(50), bill.customer_phone || '')
      .input('customer_address', sql.NVarChar(500), bill.customer_address || '')
      .input('doctor_name', sql.NVarChar(255), bill.doctor_name || '')
      .input('subtotal', sql.Decimal(10, 2), bill.subtotal)
      .input('gst_total', sql.Decimal(10, 2), bill.gst_total)
      .input('discount_percent', sql.Decimal(5, 2), bill.discount_percent ?? 0)
      .input('discount_total', sql.Decimal(10, 2), bill.discount_total)
      .input('grand_total', sql.Decimal(10, 2), bill.grand_total)
      .input('payment_mode', sql.NVarChar(20), bill.payment_mode)
      .input('created_at', sql.NVarChar(50), bill.created_at)
      .query(`
        INSERT INTO bills
          (bill_number, customer_name, customer_phone, customer_address, doctor_name, subtotal, gst_total, discount_percent, discount_total, grand_total, payment_mode, created_at)
        OUTPUT INSERTED.id
        VALUES
          (@bill_number, @customer_name, @customer_phone, @customer_address, @doctor_name, @subtotal, @gst_total, @discount_percent, @discount_total, @grand_total, @payment_mode, @created_at)
      `);

    const billId: number = billResult.recordset[0].id;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      await new sql.Request(transaction)
        .input(`bill_id_${i}`, sql.Int, billId)
        .input(`medicine_id_${i}`, sql.Int, item.medicine_id)
        .input(`medicine_name_${i}`, sql.NVarChar(255), item.medicine_name)
        .input(`batch_no_${i}`, sql.NVarChar(100), item.batch_no || '')
        .input(`hsn_${i}`, sql.NVarChar(50), item.hsn || '')
        .input(`expiry_month_${i}`, sql.Int, item.expiry_month ?? null)
        .input(`expiry_year_${i}`, sql.Int, item.expiry_year ?? null)
        .input(`manufacture_name_${i}`, sql.NVarChar(255), item.manufacture_name || '')
        .input(`is_loose_${i}`, sql.Bit, item.is_loose ? 1 : 0)
        .input(`qty_${i}`, sql.Int, item.qty)
        .input(`unit_price_${i}`, sql.Decimal(10, 2), item.unit_price)
        .input(`gst_percent_${i}`, sql.Decimal(5, 2), item.gst_percent)
        .input(`gst_amount_${i}`, sql.Decimal(10, 2), item.gst_amount)
        .input(`line_total_${i}`, sql.Decimal(10, 2), item.line_total)
        .query(`
          INSERT INTO bill_items
            (bill_id, medicine_id, medicine_name, batch_no, hsn, expiry_month, expiry_year, manufacture_name, is_loose, qty, unit_price, gst_percent, gst_amount, line_total)
          VALUES
            (@bill_id_${i}, @medicine_id_${i}, @medicine_name_${i}, @batch_no_${i}, @hsn_${i}, @expiry_month_${i}, @expiry_year_${i}, @manufacture_name_${i}, @is_loose_${i}, @qty_${i}, @unit_price_${i}, @gst_percent_${i}, @gst_amount_${i}, @line_total_${i})
        `);

      // Loose items are sold as individual units from an open pack — do not reduce batch stock
      if (!item.is_loose) {
        await new sql.Request(transaction)
          .input(`sid_${i}`,    sql.Int,           item.medicine_id)
          .input(`sqty_${i}`,   sql.Int,           item.qty)
          .input(`sbn_${i}`,    sql.NVarChar(100), item.batch_no || '')
          .query(`
            UPDATE medicine_batches
            SET stock_qty = CASE WHEN stock_qty - @sqty_${i} < 0 THEN 0 ELSE stock_qty - @sqty_${i} END
            WHERE id = (
              SELECT TOP 1 id FROM medicine_batches
              WHERE medicine_id = @sid_${i}
                AND stock_qty > 0
                AND (
                  (@sbn_${i} <> '' AND batch_no = @sbn_${i})
                  OR (@sbn_${i} = '' AND 1 = 1)
                )
              ORDER BY
                CASE WHEN @sbn_${i} <> '' AND batch_no = @sbn_${i} THEN 0 ELSE 1 END,
                expiry_year  ASC,
                expiry_month ASC,
                id ASC
            )
          `);
      }
    }

    await transaction.commit();
    return billId;
  } catch (err) {
    await transaction.rollback();
    throw err;
  }
}

export async function getAllBills(): Promise<Bill[]> {
  const pool = await getPool();
  const result = await pool.request().query(
    `SELECT * FROM bills ORDER BY created_at DESC`
  );
  return result.recordset;
}

export async function getBillById(id: number): Promise<(Bill & { items: BillItem[] }) | null> {
  const pool = await getPool();

  const billResult = await pool
    .request()
    .input('id', sql.Int, id)
    .query(`SELECT * FROM bills WHERE id = @id`);

  const bill = billResult.recordset[0] ?? null;
  if (!bill) return null;

  const itemsResult = await pool
    .request()
    .input('bill_id', sql.Int, id)
    .query(`SELECT * FROM bill_items WHERE bill_id = @bill_id`);

  return { ...bill, items: itemsResult.recordset };
}

export async function updateBill(
  id: number,
  bill: Omit<Bill, 'id' | 'bill_number'> & { created_at?: string },
  items: Omit<BillItem, 'id' | 'bill_id'>[]
): Promise<void> {
  const pool = await getPool();
  const transaction = new sql.Transaction(pool);
  await transaction.begin();
  try {
    // Restore stock for old items (skip loose items — their stock was never deducted)
    const oldItems = await new sql.Request(transaction)
      .input('bill_id_r', sql.Int, id)
      .query(`SELECT medicine_id, qty, batch_no, is_loose FROM bill_items WHERE bill_id = @bill_id_r`);
    for (const old of oldItems.recordset) {
      if (old.is_loose) continue;
      const batchNo = (old.batch_no || '').trim();
      if (batchNo) {
        await new sql.Request(transaction)
          .input(`r_mid`, sql.Int,           old.medicine_id)
          .input(`r_qty`, sql.Int,           old.qty)
          .input(`r_bn`,  sql.NVarChar(100), batchNo)
          .query(`
            UPDATE medicine_batches
            SET stock_qty = stock_qty + @r_qty
            WHERE medicine_id = @r_mid AND batch_no = @r_bn
          `);
      } else {
        await new sql.Request(transaction)
          .input(`r_mid2`, sql.Int, old.medicine_id)
          .input(`r_qty2`, sql.Int, old.qty)
          .query(`
            UPDATE medicine_batches
            SET stock_qty = stock_qty + @r_qty2
            WHERE id = (
              SELECT TOP 1 id FROM medicine_batches
              WHERE medicine_id = @r_mid2
              ORDER BY expiry_year ASC, expiry_month ASC, id ASC
            )
          `);
      }
    }

    // Delete old items
    await new sql.Request(transaction)
      .input('bill_id_d', sql.Int, id)
      .query(`DELETE FROM bill_items WHERE bill_id = @bill_id_d`);

    // Update bill header
    await new sql.Request(transaction)
      .input('id', sql.Int, id)
      .input('customer_name',    sql.NVarChar(255), bill.customer_name    || '')
      .input('customer_phone',   sql.NVarChar(50),  bill.customer_phone   || '')
      .input('customer_address', sql.NVarChar(500), bill.customer_address || '')
      .input('doctor_name',      sql.NVarChar(255), bill.doctor_name      || '')
      .input('subtotal',         sql.Decimal(10,2), bill.subtotal)
      .input('gst_total',        sql.Decimal(10,2), bill.gst_total)
      .input('discount_percent', sql.Decimal(5,2),  bill.discount_percent ?? 0)
      .input('discount_total',   sql.Decimal(10,2), bill.discount_total)
      .input('grand_total',      sql.Decimal(10,2), bill.grand_total)
      .input('payment_mode',     sql.NVarChar(20),  bill.payment_mode)
      .input('created_at',       sql.NVarChar(50),  bill.created_at || '')
      .query(`
        UPDATE bills SET
          customer_name = @customer_name, customer_phone = @customer_phone,
          customer_address = @customer_address, doctor_name = @doctor_name,
          subtotal = @subtotal, gst_total = @gst_total,
          discount_percent = @discount_percent, discount_total = @discount_total,
          grand_total = @grand_total, payment_mode = @payment_mode
          ${bill.created_at ? ', created_at = @created_at' : ''}
        WHERE id = @id
      `);

    // Insert new items and deduct stock
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      await new sql.Request(transaction)
        .input(`bill_id_${i}`,        sql.Int,            id)
        .input(`medicine_id_${i}`,    sql.Int,            item.medicine_id)
        .input(`medicine_name_${i}`,  sql.NVarChar(255),  item.medicine_name)
        .input(`batch_no_${i}`,       sql.NVarChar(100),  item.batch_no || '')
        .input(`hsn_${i}`,            sql.NVarChar(50),   item.hsn || '')
        .input(`expiry_month_${i}`,   sql.Int,            item.expiry_month ?? null)
        .input(`expiry_year_${i}`,    sql.Int,            item.expiry_year ?? null)
        .input(`manufacture_name_${i}`, sql.NVarChar(255), item.manufacture_name || '')
        .input(`is_loose_${i}`,       sql.Bit,            item.is_loose ? 1 : 0)
        .input(`qty_${i}`,            sql.Int,            item.qty)
        .input(`unit_price_${i}`,     sql.Decimal(10,2),  item.unit_price)
        .input(`gst_percent_${i}`,    sql.Decimal(5,2),   item.gst_percent)
        .input(`gst_amount_${i}`,     sql.Decimal(10,2),  item.gst_amount)
        .input(`line_total_${i}`,     sql.Decimal(10,2),  item.line_total)
        .query(`
          INSERT INTO bill_items
            (bill_id, medicine_id, medicine_name, batch_no, hsn, expiry_month, expiry_year,
             manufacture_name, is_loose, qty, unit_price, gst_percent, gst_amount, line_total)
          VALUES
            (@bill_id_${i}, @medicine_id_${i}, @medicine_name_${i}, @batch_no_${i}, @hsn_${i},
             @expiry_month_${i}, @expiry_year_${i}, @manufacture_name_${i}, @is_loose_${i},
             @qty_${i}, @unit_price_${i}, @gst_percent_${i}, @gst_amount_${i}, @line_total_${i})
        `);

      if (!item.is_loose) {
        await new sql.Request(transaction)
          .input(`sid_${i}`,  sql.Int,           item.medicine_id)
          .input(`sqty_${i}`, sql.Int,           item.qty)
          .input(`sbn_${i}`,  sql.NVarChar(100), item.batch_no || '')
          .query(`
            UPDATE medicine_batches
            SET stock_qty = CASE WHEN stock_qty - @sqty_${i} < 0 THEN 0 ELSE stock_qty - @sqty_${i} END
            WHERE id = (
              SELECT TOP 1 id FROM medicine_batches
              WHERE medicine_id = @sid_${i}
                AND stock_qty > 0
                AND (
                  (@sbn_${i} <> '' AND batch_no = @sbn_${i})
                  OR (@sbn_${i} = '' AND 1 = 1)
                )
              ORDER BY
                CASE WHEN @sbn_${i} <> '' AND batch_no = @sbn_${i} THEN 0 ELSE 1 END,
                expiry_year  ASC,
                expiry_month ASC,
                id ASC
            )
          `);
      }
    }

    await transaction.commit();
  } catch (err) {
    await transaction.rollback();
    throw err;
  }
}

export async function deleteBill(id: number): Promise<void> {
  const pool = await getPool();
  const transaction = new sql.Transaction(pool);
  await transaction.begin();
  try {
    // Restore stock before deleting items (skip loose items — their stock was never deducted)
    const oldItems = await new sql.Request(transaction)
      .input('bill_id_r', sql.Int, id)
      .query(`SELECT medicine_id, qty, batch_no, is_loose FROM bill_items WHERE bill_id = @bill_id_r`);
    for (const old of oldItems.recordset) {
      if (old.is_loose) continue;
      const batchNo = (old.batch_no || '').trim();
      if (batchNo) {
        await new sql.Request(transaction)
          .input(`r_mid`, sql.Int,           old.medicine_id)
          .input(`r_qty`, sql.Int,           old.qty)
          .input(`r_bn`,  sql.NVarChar(100), batchNo)
          .query(`
            UPDATE medicine_batches SET stock_qty = stock_qty + @r_qty
            WHERE medicine_id = @r_mid AND batch_no = @r_bn
          `);
      } else {
        await new sql.Request(transaction)
          .input(`r_mid2`, sql.Int, old.medicine_id)
          .input(`r_qty2`, sql.Int, old.qty)
          .query(`
            UPDATE medicine_batches SET stock_qty = stock_qty + @r_qty2
            WHERE id = (
              SELECT TOP 1 id FROM medicine_batches WHERE medicine_id = @r_mid2
              ORDER BY expiry_year ASC, expiry_month ASC, id ASC
            )
          `);
      }
    }
    await new sql.Request(transaction)
      .input('bill_id', sql.Int, id)
      .query(`DELETE FROM bill_items WHERE bill_id = @bill_id`);
    await new sql.Request(transaction)
      .input('id', sql.Int, id)
      .query(`DELETE FROM bills WHERE id = @id`);
    await transaction.commit();
  } catch (err) {
    await transaction.rollback();
    throw err;
  }
}

export async function getTodayStats(): Promise<{ total: number; count: number }> {
  const pool = await getPool();
  const today = new Date().toISOString().split('T')[0];
  const result = await pool
    .request()
    .input('today', sql.NVarChar(20), `${today}%`)
    .query(`
      SELECT COALESCE(SUM(grand_total), 0) AS total, COUNT(*) AS count
      FROM bills WHERE created_at LIKE @today
    `);
  return result.recordset[0] ?? { total: 0, count: 0 };
}

export async function getMonthStats(): Promise<{ total: number; count: number }> {
  const pool = await getPool();
  const month = new Date().toISOString().substring(0, 7);
  const result = await pool
    .request()
    .input('month', sql.NVarChar(20), `${month}%`)
    .query(`
      SELECT COALESCE(SUM(grand_total), 0) AS total, COUNT(*) AS count
      FROM bills WHERE created_at LIKE @month
    `);
  return result.recordset[0] ?? { total: 0, count: 0 };
}
