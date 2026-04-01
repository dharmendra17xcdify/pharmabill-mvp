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

      // ── Resolve medicine_id — auto-create if not matched ────────────────────
      // When items come from AI extraction medicine_id is null.
      // Find existing medicine by name (case-insensitive) or create a new one.
      let resolvedMedicineId: number | null = item.medicine_id ?? null;

      if (!resolvedMedicineId && item.medicine_name.trim()) {
        const findResult = await new sql.Request(transaction)
          .input(`find_name_${i}`, sql.NVarChar(255), item.medicine_name.trim())
          .query(`SELECT TOP 1 id FROM medicines WHERE LOWER(name) = LOWER(@find_name_${i})`);

        if (findResult.recordset.length > 0) {
          resolvedMedicineId = findResult.recordset[0].id;
        } else {
          // Insert only the truly required columns (name, mrp, selling_price are NOT NULL without defaults)
          const insertResult = await new sql.Request(transaction)
            .input(`new_name_${i}`, sql.NVarChar(255), item.medicine_name.trim())
            .input(`new_mrp_${i}`,  sql.Decimal(10, 2), item.mrp || 0)
            .input(`new_sp_${i}`,   sql.Decimal(10, 2), item.mrp || 0)
            .input(`new_ca_${i}`,   sql.NVarChar(50),   purchase.created_at)
            .query(`
              INSERT INTO medicines (name, mrp, selling_price, created_at, updated_at)
              OUTPUT INSERTED.id
              VALUES (@new_name_${i}, @new_mrp_${i}, @new_sp_${i}, @new_ca_${i}, @new_ca_${i})
            `);
          resolvedMedicineId = insertResult.recordset[0].id;

          // Back-fill optional catalogue fields in a separate update
          await new sql.Request(transaction)
            .input(`upd_id_${i}`,   sql.Int,            resolvedMedicineId)
            .input(`upd_hsn_${i}`,  sql.NVarChar(50),   item.hsn || '')
            .input(`upd_pack_${i}`, sql.NVarChar(100),  item.packing || '')
            .input(`upd_gst_${i}`,  sql.Decimal(5, 2),  Number(item.cgst_percent || 0) * 2)
            .input(`upd_mfg_${i}`,  sql.NVarChar(255),  item.manufacture_name || '')
            .input(`upd_rate_${i}`, sql.Decimal(10, 2), item.rate || 0)
            .query(`
              UPDATE medicines SET
                hsn              = @upd_hsn_${i},
                packing          = @upd_pack_${i},
                gst_percent      = @upd_gst_${i},
                manufacture_name = @upd_mfg_${i},
                rate             = @upd_rate_${i}
              WHERE id = @upd_id_${i}
            `);
        }
      }

      // ── Upsert into medicine_batches ─────────────────────────────────────────
      if (resolvedMedicineId) {
        const receivedQty = item.qty + (item.deal_qty || 0);
        const batchKey = (item.batch_no || '').trim();

        if (batchKey) {
          // Named batch: upsert by (medicine_id, batch_no)
          await new sql.Request(transaction)
            .input(`upsert_mid_${i}`,   sql.Int,            resolvedMedicineId)
            .input(`upsert_bn_${i}`,    sql.NVarChar(100),  batchKey)
            .input(`upsert_em_${i}`,    sql.Int,            item.expiry_month ?? null)
            .input(`upsert_ey_${i}`,    sql.Int,            item.expiry_year  ?? null)
            .input(`upsert_mrp_${i}`,   sql.Decimal(10, 2), item.mrp  || 0)
            .input(`upsert_sp_${i}`,    sql.Decimal(10, 2), item.mrp  || 0)   // default selling = mrp
            .input(`upsert_rate_${i}`,  sql.Decimal(10, 2), item.rate || 0)
            .input(`upsert_disc_${i}`,  sql.Decimal(5,  2), item.discount || 0)
            .input(`upsert_qty_${i}`,   sql.Int,            receivedQty)
            .input(`upsert_ca_${i}`,    sql.NVarChar(50),   purchase.created_at)
            .query(`
              IF EXISTS (
                SELECT 1 FROM medicine_batches
                WHERE medicine_id = @upsert_mid_${i} AND batch_no = @upsert_bn_${i}
              )
                UPDATE medicine_batches SET
                  stock_qty     = stock_qty + @upsert_qty_${i},
                  expiry_month  = ISNULL(@upsert_em_${i},  expiry_month),
                  expiry_year   = ISNULL(@upsert_ey_${i},  expiry_year),
                  mrp           = @upsert_mrp_${i},
                  rate          = @upsert_rate_${i},
                  discount      = @upsert_disc_${i}
                WHERE medicine_id = @upsert_mid_${i} AND batch_no = @upsert_bn_${i}
              ELSE
                INSERT INTO medicine_batches
                  (medicine_id, batch_no, expiry_month, expiry_year, mrp, selling_price, rate, discount, stock_qty, created_at)
                VALUES
                  (@upsert_mid_${i}, @upsert_bn_${i}, @upsert_em_${i}, @upsert_ey_${i},
                   @upsert_mrp_${i}, @upsert_sp_${i}, @upsert_rate_${i}, @upsert_disc_${i},
                   @upsert_qty_${i}, @upsert_ca_${i})
            `);
        } else {
          // No batch number — just add stock to the most recent batch, or create one
          await new sql.Request(transaction)
            .input(`nobatch_mid_${i}`,  sql.Int,            resolvedMedicineId)
            .input(`nobatch_qty_${i}`,  sql.Int,            receivedQty)
            .input(`nobatch_mrp_${i}`,  sql.Decimal(10, 2), item.mrp  || 0)
            .input(`nobatch_rate_${i}`, sql.Decimal(10, 2), item.rate || 0)
            .input(`nobatch_ca_${i}`,   sql.NVarChar(50),   purchase.created_at)
            .query(`
              IF EXISTS (SELECT 1 FROM medicine_batches WHERE medicine_id = @nobatch_mid_${i})
                UPDATE medicine_batches SET
                  stock_qty = stock_qty + @nobatch_qty_${i},
                  mrp       = CASE WHEN @nobatch_mrp_${i} > 0 THEN @nobatch_mrp_${i} ELSE mrp END,
                  rate      = CASE WHEN @nobatch_rate_${i} > 0 THEN @nobatch_rate_${i} ELSE rate END
                WHERE id = (
                  SELECT TOP 1 id FROM medicine_batches
                  WHERE medicine_id = @nobatch_mid_${i}
                  ORDER BY id DESC
                )
              ELSE
                INSERT INTO medicine_batches
                  (medicine_id, batch_no, mrp, selling_price, rate, stock_qty, created_at)
                VALUES
                  (@nobatch_mid_${i}, '', @nobatch_mrp_${i}, @nobatch_mrp_${i}, @nobatch_rate_${i}, @nobatch_qty_${i}, @nobatch_ca_${i})
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
