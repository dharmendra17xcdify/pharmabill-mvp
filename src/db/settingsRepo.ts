import { StoreSettings } from '../types/settings';
import { getDb } from './index';
import dayjs from 'dayjs';

export async function getSettings(): Promise<StoreSettings | null> {
  const db = getDb();
  const row = await db.getFirstAsync<StoreSettings>(
    `SELECT * FROM store_settings ORDER BY id ASC LIMIT 1`
  );
  return row ?? null;
}

export async function saveSettings(settings: StoreSettings): Promise<void> {
  const db = getDb();
  const now = dayjs().toISOString();

  const existing = await getSettings();
  if (existing?.id) {
    await db.runAsync(
      `UPDATE store_settings SET
        store_name = ?, owner_name = ?, phone = ?, address = ?,
        gstin = ?, drug_license = ?, invoice_prefix = ?, updated_at = ?
       WHERE id = ?`,
      [
        settings.store_name,
        settings.owner_name,
        settings.phone,
        settings.address,
        settings.gstin,
        settings.drug_license,
        settings.invoice_prefix || 'MED',
        now,
        existing.id,
      ]
    );
  } else {
    await db.runAsync(
      `INSERT INTO store_settings
        (store_name, owner_name, phone, address, gstin, drug_license, invoice_prefix, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        settings.store_name,
        settings.owner_name,
        settings.phone,
        settings.address,
        settings.gstin,
        settings.drug_license,
        settings.invoice_prefix || 'MED',
        now,
        now,
      ]
    );
  }
}
