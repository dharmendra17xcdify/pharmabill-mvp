import { getPool, sql } from './db';
import { Supplier } from '@/types/supplier';

export async function getAllSuppliers(): Promise<Supplier[]> {
  const pool = await getPool();
  const result = await pool.request().query(
    `SELECT * FROM supplier_master ORDER BY name ASC`
  );
  return result.recordset;
}

export async function getSupplierById(id: number): Promise<Supplier | null> {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('id', sql.Int, id)
    .query(`SELECT * FROM supplier_master WHERE id = @id`);
  return result.recordset[0] ?? null;
}

export async function createSupplier(
  supplier: Omit<Supplier, 'id'>
): Promise<number> {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('name',         sql.NVarChar(255), supplier.name)
    .input('gstin',        sql.NVarChar(50),  supplier.gstin        || '')
    .input('drug_license', sql.NVarChar(100), supplier.drug_license || '')
    .input('phone',        sql.NVarChar(50),  supplier.phone        || '')
    .input('email',        sql.NVarChar(255), supplier.email        || '')
    .input('address',      sql.NVarChar(500), supplier.address      || '')
    .input('created_at',   sql.NVarChar(50),  supplier.created_at   || '')
    .input('updated_at',   sql.NVarChar(50),  supplier.updated_at   || '')
    .query(`
      INSERT INTO supplier_master (name, gstin, drug_license, phone, email, address, created_at, updated_at)
      OUTPUT INSERTED.id
      VALUES (@name, @gstin, @drug_license, @phone, @email, @address, @created_at, @updated_at)
    `);
  return result.recordset[0].id;
}

export async function updateSupplier(
  id: number,
  supplier: Omit<Supplier, 'id' | 'created_at'>
): Promise<void> {
  const pool = await getPool();
  await pool
    .request()
    .input('id',           sql.Int,           id)
    .input('name',         sql.NVarChar(255), supplier.name)
    .input('gstin',        sql.NVarChar(50),  supplier.gstin        || '')
    .input('drug_license', sql.NVarChar(100), supplier.drug_license || '')
    .input('phone',        sql.NVarChar(50),  supplier.phone        || '')
    .input('email',        sql.NVarChar(255), supplier.email        || '')
    .input('address',      sql.NVarChar(500), supplier.address      || '')
    .input('updated_at',   sql.NVarChar(50),  supplier.updated_at   || '')
    .query(`
      UPDATE supplier_master
      SET name = @name, gstin = @gstin, drug_license = @drug_license,
          phone = @phone, email = @email, address = @address, updated_at = @updated_at
      WHERE id = @id
    `);
}

export async function deleteSupplier(id: number): Promise<void> {
  const pool = await getPool();
  await pool
    .request()
    .input('id', sql.Int, id)
    .query(`DELETE FROM supplier_master WHERE id = @id`);
}
