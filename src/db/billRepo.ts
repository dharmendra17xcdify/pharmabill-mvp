import { Bill, BillItem } from '../types/bill';
import { getDb } from './index';
import { deductStock } from './medicineRepo';

export async function getNextInvoiceNumber(prefix: string): Promise<string> {
  const db = getDb();
  const row = await db.getFirstAsync<{ value: string }>(
    `SELECT value FROM app_meta WHERE key = 'last_invoice_number'`
  );
  const next = parseInt(row?.value ?? '0', 10) + 1;
  await db.runAsync(
    `UPDATE app_meta SET value = ? WHERE key = 'last_invoice_number'`,
    [String(next)]
  );
  return `${prefix}-${String(next).padStart(4, '0')}`;
}

export async function saveBill(
  bill: Omit<Bill, 'id'>,
  items: Omit<BillItem, 'id' | 'bill_id'>[]
): Promise<number> {
  const db = getDb();

  const billResult = await db.runAsync(
    `INSERT INTO bills
      (bill_number, customer_name, customer_phone, subtotal, gst_total, discount_total, grand_total, payment_mode, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      bill.bill_number,
      bill.customer_name || '',
      bill.customer_phone || '',
      bill.subtotal,
      bill.gst_total,
      bill.discount_total,
      bill.grand_total,
      bill.payment_mode,
      bill.created_at,
    ]
  );

  const billId = billResult.lastInsertRowId;

  for (const item of items) {
    await db.runAsync(
      `INSERT INTO bill_items
        (bill_id, medicine_id, medicine_name, batch_no, qty, unit_price, gst_percent, gst_amount, line_total)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        billId,
        item.medicine_id,
        item.medicine_name,
        item.batch_no || '',
        item.qty,
        item.unit_price,
        item.gst_percent,
        item.gst_amount,
        item.line_total,
      ]
    );
    await deductStock(item.medicine_id, item.qty);
  }

  return billId;
}

export async function getAllBills(): Promise<Bill[]> {
  const db = getDb();
  return await db.getAllAsync<Bill>(
    `SELECT * FROM bills ORDER BY created_at DESC`
  );
}

export async function getBillById(id: number): Promise<(Bill & { items: BillItem[] }) | null> {
  const db = getDb();
  const bill = await db.getFirstAsync<Bill>(
    `SELECT * FROM bills WHERE id = ?`,
    [id]
  );
  if (!bill) return null;

  const items = await db.getAllAsync<BillItem>(
    `SELECT * FROM bill_items WHERE bill_id = ?`,
    [id]
  );
  return { ...bill, items };
}

export async function deleteBill(id: number): Promise<void> {
  const db = getDb();
  await db.runAsync(`DELETE FROM bill_items WHERE bill_id = ?`, [id]);
  await db.runAsync(`DELETE FROM bills WHERE id = ?`, [id]);
}

export async function getTodayStats(): Promise<{ total: number; count: number }> {
  const db = getDb();
  const today = new Date().toISOString().split('T')[0];
  const row = await db.getFirstAsync<{ total: number; count: number }>(
    `SELECT COALESCE(SUM(grand_total), 0) as total, COUNT(*) as count
     FROM bills WHERE created_at LIKE ?`,
    [`${today}%`]
  );
  return row ?? { total: 0, count: 0 };
}

export async function getMonthStats(): Promise<{ total: number; count: number }> {
  const db = getDb();
  const month = new Date().toISOString().substring(0, 7);
  const row = await db.getFirstAsync<{ total: number; count: number }>(
    `SELECT COALESCE(SUM(grand_total), 0) as total, COUNT(*) as count
     FROM bills WHERE created_at LIKE ?`,
    [`${month}%`]
  );
  return row ?? { total: 0, count: 0 };
}
