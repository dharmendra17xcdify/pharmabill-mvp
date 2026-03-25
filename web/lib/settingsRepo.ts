import { getPool, sql } from './db';
import { StoreSettings } from '@/types/settings';
import dayjs from 'dayjs';

export async function getSettings(): Promise<StoreSettings | null> {
  const pool = await getPool();
  const result = await pool
    .request()
    .query(`SELECT TOP 1 * FROM store_settings ORDER BY id ASC`);
  return result.recordset[0] ?? null;
}

export async function saveSettings(settings: StoreSettings): Promise<void> {
  const pool = await getPool();
  const now = dayjs().toISOString();
  const existing = await getSettings();

  if (existing?.id) {
    await pool
      .request()
      .input('id', sql.Int, existing.id)
      .input('store_name', sql.NVarChar(255), settings.store_name)
      .input('owner_name', sql.NVarChar(255), settings.owner_name || '')
      .input('phone', sql.NVarChar(50), settings.phone || '')
      .input('address', sql.NVarChar(500), settings.address || '')
      .input('gstin', sql.NVarChar(50), settings.gstin || '')
      .input('drug_license', sql.NVarChar(100), settings.drug_license || '')
      .input('invoice_prefix', sql.NVarChar(20), settings.invoice_prefix || 'MED')
      .input('updated_at', sql.NVarChar(50), now)
      .query(`
        UPDATE store_settings SET
          store_name = @store_name, owner_name = @owner_name, phone = @phone,
          address = @address, gstin = @gstin, drug_license = @drug_license,
          invoice_prefix = @invoice_prefix, updated_at = @updated_at
        WHERE id = @id
      `);
  } else {
    await pool
      .request()
      .input('store_name', sql.NVarChar(255), settings.store_name)
      .input('owner_name', sql.NVarChar(255), settings.owner_name || '')
      .input('phone', sql.NVarChar(50), settings.phone || '')
      .input('address', sql.NVarChar(500), settings.address || '')
      .input('gstin', sql.NVarChar(50), settings.gstin || '')
      .input('drug_license', sql.NVarChar(100), settings.drug_license || '')
      .input('invoice_prefix', sql.NVarChar(20), settings.invoice_prefix || 'MED')
      .input('created_at', sql.NVarChar(50), now)
      .input('updated_at', sql.NVarChar(50), now)
      .query(`
        INSERT INTO store_settings
          (store_name, owner_name, phone, address, gstin, drug_license, invoice_prefix, created_at, updated_at)
        VALUES
          (@store_name, @owner_name, @phone, @address, @gstin, @drug_license, @invoice_prefix, @created_at, @updated_at)
      `);
  }
}
