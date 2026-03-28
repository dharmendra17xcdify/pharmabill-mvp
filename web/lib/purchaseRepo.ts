import { getPool, sql } from './db';
import { Purchase, PurchaseItem } from '@/types/purchase';

export async function getNextPurchaseNumber(): Promise<string> {
  const pool = await getPool();
  const result = await pool
    .request()
    .query(`
      UPDATE app_meta
      SET value = CAST(CAST(value AS INT) + 1 AS NVARCHAR(10))
      OUTPUT INSERTED.value
      WHERE [key] = 'last_purchase_number'
    `);
  const next = result.recordset[0].value;
  return `PO-${String(next).padStart(4, '0')}`;
}

export async function savePurchase(
  purchase: Omit<Purchase, 'id'>,
  items: Omit<PurchaseItem, 'id' | 'purchase_id'>[]
): Promise<number> {
  const pool = await getPool();
  const transaction = new sql.Transaction(pool);
  await transaction.begin();

  try {
    const purchaseResult = await new sql.Request(transaction)
      .input('purchase_number', sql.NVarChar(50), purchase.purchase_number)
      .input('supplier_name', sql.NVarChar(255), purchase.supplier_name || '')
      .input('supplier_invoice_no', sql.NVarChar(100), purchase.supplier_invoice_no || '')
      .input('supplier_gstin', sql.NVarChar(50), purchase.supplier_gstin || '')
      .input('supplier_address', sql.NVarChar(500), purchase.supplier_address || '')
      .input('supplier_phone', sql.NVarChar(50), purchase.supplier_phone || '')
      .input('supplier_drug_license', sql.NVarChar(100), purchase.supplier_drug_license || '')
      .input('subtotal', sql.Decimal(10, 2), purchase.subtotal)
      .input('cgst_total', sql.Decimal(10, 2), purchase.cgst_total)
      .input('sgst_total', sql.Decimal(10, 2), purchase.sgst_total)
      .input('discount_total', sql.Decimal(10, 2), purchase.discount_total)
      .input('grand_total', sql.Decimal(10, 2), purchase.grand_total)
      .input('payment_mode', sql.NVarChar(20), purchase.payment_mode)
      .input('created_at', sql.NVarChar(50), purchase.created_at)
      .query(`
        INSERT INTO purchases
          (purchase_number, supplier_name, supplier_invoice_no, supplier_gstin, supplier_address, supplier_phone, supplier_drug_license, subtotal, cgst_total, sgst_total, discount_total, grand_total, payment_mode, created_at)
        OUTPUT INSERTED.id
        VALUES
          (@purchase_number, @supplier_name, @supplier_invoice_no, @supplier_gstin, @supplier_address, @supplier_phone, @supplier_drug_license, @subtotal, @cgst_total, @sgst_total, @discount_total, @grand_total, @payment_mode, @created_at)
      `);

    const purchaseId: number = purchaseResult.recordset[0].id;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];

      await new sql.Request(transaction)
        .input(`purchase_id_${i}`, sql.Int, purchaseId)
        .input(`medicine_id_${i}`, sql.Int, item.medicine_id ?? null)
        .input(`medicine_name_${i}`, sql.NVarChar(255), item.medicine_name || '')
        .input(`hsn_${i}`, sql.NVarChar(50), item.hsn || '')
        .input(`batch_no_${i}`, sql.NVarChar(100), item.batch_no || '')
        .input(`expiry_month_${i}`, sql.Int, item.expiry_month ?? null)
        .input(`expiry_year_${i}`, sql.Int, item.expiry_year ?? null)
        .input(`packing_${i}`, sql.NVarChar(100), item.packing || '')
        .input(`pack_qty_${i}`, sql.Int, item.pack_qty || 1)
        .input(`qty_${i}`, sql.Int, item.qty)
        .input(`deal_qty_${i}`, sql.Int, item.deal_qty || 0)
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
        .query(`
          INSERT INTO purchase_items
            (purchase_id, medicine_id, medicine_name, hsn, batch_no, expiry_month, expiry_year, packing, pack_qty, qty, deal_qty, rate, discount, cgst_percent, sgst_percent, cgst_amount, sgst_amount, taxable_amount, amount, mrp, manufacture_name)
          VALUES
            (@purchase_id_${i}, @medicine_id_${i}, @medicine_name_${i}, @hsn_${i}, @batch_no_${i}, @expiry_month_${i}, @expiry_year_${i}, @packing_${i}, @pack_qty_${i}, @qty_${i}, @deal_qty_${i}, @rate_${i}, @discount_${i}, @cgst_percent_${i}, @sgst_percent_${i}, @cgst_amount_${i}, @sgst_amount_${i}, @taxable_amount_${i}, @amount_${i}, @mrp_${i}, @manufacture_name_${i})
        `);

      if (item.medicine_id) {
        const hasBatch = item.batch_no && item.batch_no.trim() !== '';
        const hasExpiry = item.expiry_month && item.expiry_year;

        if (hasBatch && hasExpiry) {
          await new sql.Request(transaction)
            .input(`upd_medicine_id_${i}`, sql.Int, item.medicine_id)
            .input(`upd_qty_${i}`, sql.Int, item.qty + (item.deal_qty || 0))
            .input(`upd_batch_no_${i}`, sql.NVarChar(100), item.batch_no)
            .input(`upd_expiry_month_${i}`, sql.Int, item.expiry_month)
            .input(`upd_expiry_year_${i}`, sql.Int, item.expiry_year)
            .query(`
              UPDATE medicines
              SET stock_qty = stock_qty + @upd_qty_${i},
                  batch_no = @upd_batch_no_${i},
                  expiry_month = @upd_expiry_month_${i},
                  expiry_year = @upd_expiry_year_${i}
              WHERE id = @upd_medicine_id_${i}
            `);
        } else if (hasBatch) {
          await new sql.Request(transaction)
            .input(`upd_medicine_id_${i}`, sql.Int, item.medicine_id)
            .input(`upd_qty_${i}`, sql.Int, item.qty + (item.deal_qty || 0))
            .input(`upd_batch_no_${i}`, sql.NVarChar(100), item.batch_no)
            .query(`
              UPDATE medicines
              SET stock_qty = stock_qty + @upd_qty_${i},
                  batch_no = @upd_batch_no_${i}
              WHERE id = @upd_medicine_id_${i}
            `);
        } else {
          await new sql.Request(transaction)
            .input(`upd_medicine_id_${i}`, sql.Int, item.medicine_id)
            .input(`upd_qty_${i}`, sql.Int, item.qty + (item.deal_qty || 0))
            .query(`
              UPDATE medicines
              SET stock_qty = stock_qty + @upd_qty_${i}
              WHERE id = @upd_medicine_id_${i}
            `);
        }
      }
    }

    await transaction.commit();
    return purchaseId;
  } catch (err) {
    await transaction.rollback();
    throw err;
  }
}

export async function getAllPurchases(): Promise<Purchase[]> {
  const pool = await getPool();
  const result = await pool.request().query(
    `SELECT * FROM purchases ORDER BY created_at DESC`
  );
  return result.recordset;
}

export async function getPurchaseById(
  id: number
): Promise<(Purchase & { items: PurchaseItem[] }) | null> {
  const pool = await getPool();

  const purchaseResult = await pool
    .request()
    .input('id', sql.Int, id)
    .query(`SELECT * FROM purchases WHERE id = @id`);

  const purchase = purchaseResult.recordset[0] ?? null;
  if (!purchase) return null;

  const itemsResult = await pool
    .request()
    .input('purchase_id', sql.Int, id)
    .query(`SELECT * FROM purchase_items WHERE purchase_id = @purchase_id ORDER BY id`);

  return { ...purchase, items: itemsResult.recordset };
}
