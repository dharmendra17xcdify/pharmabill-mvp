import * as SQLite from 'expo-sqlite';
import {
  CREATE_APP_META,
  CREATE_BILL_ITEMS,
  CREATE_BILLS,
  CREATE_MEDICINES,
  CREATE_STORE_SETTINGS,
} from './schema';

let _db: SQLite.SQLiteDatabase | null = null;

export function getDb(): SQLite.SQLiteDatabase {
  if (!_db) {
    throw new Error('Database not initialized. Call initDb() first.');
  }
  return _db;
}

export async function initDb(): Promise<void> {
  _db = await SQLite.openDatabaseAsync('pharmabill.db');

  await _db.execAsync(`PRAGMA journal_mode = WAL;`);
  await _db.execAsync(CREATE_STORE_SETTINGS);
  await _db.execAsync(CREATE_MEDICINES);
  await _db.execAsync(CREATE_BILLS);
  await _db.execAsync(CREATE_BILL_ITEMS);
  await _db.execAsync(CREATE_APP_META);

  // Seed invoice counter if not exists
  await _db.runAsync(
    `INSERT OR IGNORE INTO app_meta (key, value) VALUES (?, ?)`,
    ['last_invoice_number', '0']
  );
}
