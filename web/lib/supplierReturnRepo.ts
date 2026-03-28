import { getPool, sql } from './db';
import { SupplierReturn, SupplierReturnItem } from '@/types/supplierReturn';

export async function getNextReturnNumber(): Promise<string> {
  const pool = await getPool();
  const result = await pool
    .request()
    .query(`
      UPDATE app_meta
      SET value = CAST(CAST(value AS INT) + 1 AS NVARCHAR(10))
      OUTPUT INSERTED.value
      WHERE [key] = 'last_return_number'
    `);
  const next = result.recordset[0].value;
  return `CN-${String(next).padStart(4, '0')}`;
}

export async function saveSupplierReturn(
  ret: Omit<SupplierReturn, 'id'>,
  items: Omit<SupplierReturnItem, 'id' | 'return_id'>[]
): Promise<number> {
  const pool = await getPool();
  const transaction = new sql.Transaction(pool);
  await transaction.begin();

  try {
    const returnResult = await new sql.Request(transaction)
      .input('return_number', sql.NVarChar(50), ret.return_number)
      .input('supplier_name', sql.NVarChar(255), ret.supplier_name || '')
      .input('supplier_invoice_no', sql.NVarChar(100), ret.supplier_invoice_no || '')
      .input('credit_note_no', sql.NVarChar(100), ret.credit_note_no || '')
      .input('supplier_gstin', sql.NVarChar(50), ret.supplier_gstin || '')
      .input('supplier_phone', sql.NVarChar(50), ret.supplier_phone || '')
      .input('supplier_address', sql.NVarChar(500), ret.supplier_address || '')
      .input('supplier_drug_license', sql.NVarChar(100), ret.supplier_drug_license || '')
      .input('subtotal', sql.Decimal(10, 2), ret.subtotal)
      .input('cgst_total', sql.Decimal(10, 2), ret.cgst_total)
      .input('sgst_total', sql.Decimal(10, 2), ret.sgst_total)
      .input('grand_total', sql.Decimal(10, 2), ret.grand_total)
      .input('created_at', sql.NVarChar(50), ret.created_at)
      .query(`
        INSERT INTO supplier_returns
          (return_number, supplier_name, supplier_invoice_no, credit_note_no, supplier_gstin, supplier_phone, supplier_address, supplier_drug_license, subtotal, cgst_total, sgst_total, grand_total, created_at)
        OUTPUT INSERTED.id
        VALUES
          (@return_number, @supplier_name, @supplier_invoice_no, @credit_note_no, @supplier_gstin, @supplier_phone, @supplier_address, @supplier_drug_license, @subtotal, @cgst_total, @sgst_total, @grand_total, @created_at)
      `);

    const returnId: number = returnResult.recordset[0].id;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];

      await new sql.Request(transaction)
        .input(`return_id_${i}`, sql.Int, returnId)
        .input(`medicine_id_${i}`, sql.Int, item.medicine_id ?? null)
        .input(`medicine_name_${i}`, sql.NVarChar(255), item.medicine_name || '')
        .input(`hsn_${i}`, sql.NVarChar(50), item.hsn || '')
        .input(`batch_no_${i}`, sql.NVarChar(100), item.batch_no || '')
        .input(`expiry_month_${i}`, sql.Int, item.expiry_month ?? null)
        .input(`expiry_year_${i}`, sql.Int, item.expiry_year ?? null)
        .input(`packing_${i}`, sql.NVarChar(100), item.packing || '')
        .input(`qty_${i}`, sql.Int, item.qty)
        .input(`rate_${i}`, sql.Decimal(10, 2), item.rate)
        .input(`discount_${i}`, sql.Decimal(5, 2), item.discount || 0)
        .input(`cgst_percent_${i}`, sql.Decimal(5, 2), item.cgst_percent || 0)
        .input(`sgst_percent_${i}`, sql.Decimal(5, 2), item.sgst_percent || 0)
        .input(`cgst_amount_${i}`, sql.Decimal(10, 2), item.cgst_amount || 0)
        .input(`sgst_amount_${i}`, sql.Decimal(10, 2), item.sgst_amount || 0)
        .input(`taxable_amount_${i}`, sql.Decimal(10, 2), item.taxable_amount || 0)
        .input(`amount_${i}`, sql.Decimal(10, 2), item.amount)
        .input(`mrp_${i}`, sql.Decimal(10, 2), item.mrp || 0)
        .input(`manufacture_name_${i}`, sql.NVarChar(255), item.manufacture_name || '')
        .input(`return_reason_${i}`, sql.NVarChar(100), item.return_reason || 'Expired')
        .query(`
          INSERT INTO supplier_return_items
            (return_id, medicine_id, medicine_name, hsn, batch_no, expiry_month, expiry_year, packing, qty, rate, discount, cgst_percent, sgst_percent, cgst_amount, sgst_amount, taxable_amount, amount, mrp, manufacture_name, return_reason)
          VALUES
            (@return_id_${i}, @medicine_id_${i}, @medicine_name_${i}, @hsn_${i}, @batch_no_${i}, @expiry_month_${i}, @expiry_year_${i}, @packing_${i}, @qty_${i}, @rate_${i}, @discount_${i}, @cgst_percent_${i}, @sgst_percent_${i}, @cgst_amount_${i}, @sgst_amount_${i}, @taxable_amount_${i}, @amount_${i}, @mrp_${i}, @manufacture_name_${i}, @return_reason_${i})
        `);

      if (item.medicine_id) {
        await new sql.Request(transaction)
          .input(`upd_medicine_id_${i}`, sql.Int, item.medicine_id)
          .input(`upd_qty_${i}`, sql.Int, item.qty)
          .query(`
            UPDATE medicines
            SET stock_qty = CASE WHEN stock_qty - @upd_qty_${i} < 0 THEN 0 ELSE stock_qty - @upd_qty_${i} END
            WHERE id = @upd_medicine_id_${i}
          `);
      }
    }

    await transaction.commit();
    return returnId;
  } catch (err) {
    await transaction.rollback();
    throw err;
  }
}

export async function getAllSupplierReturns(): Promise<SupplierReturn[]> {
  const pool = await getPool();
  const result = await pool.request().query(
    `SELECT * FROM supplier_returns ORDER BY created_at DESC`
  );
  return result.recordset;
}

export async function getSupplierReturnById(
  id: number
): Promise<(SupplierReturn & { items: SupplierReturnItem[] }) | null> {
  const pool = await getPool();

  const returnResult = await pool
    .request()
    .input('id', sql.Int, id)
    .query(`SELECT * FROM supplier_returns WHERE id = @id`);

  const ret = returnResult.recordset[0] ?? null;
  if (!ret) return null;

  const itemsResult = await pool
    .request()
    .input('return_id', sql.Int, id)
    .query(`SELECT * FROM supplier_return_items WHERE return_id = @return_id ORDER BY id`);

  return { ...ret, items: itemsResult.recordset };
}
