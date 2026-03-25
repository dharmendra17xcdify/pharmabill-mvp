export const CREATE_STORE_SETTINGS = `
CREATE TABLE IF NOT EXISTS store_settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  store_name TEXT NOT NULL,
  owner_name TEXT,
  phone TEXT,
  address TEXT,
  gstin TEXT,
  drug_license TEXT,
  invoice_prefix TEXT DEFAULT 'MED',
  created_at TEXT,
  updated_at TEXT
);`;

export const CREATE_MEDICINES = `
CREATE TABLE IF NOT EXISTS medicines (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  generic_name TEXT,
  batch_no TEXT,
  expiry_month INTEGER,
  expiry_year INTEGER,
  mrp REAL NOT NULL,
  selling_price REAL NOT NULL,
  gst_percent REAL NOT NULL DEFAULT 0,
  stock_qty REAL NOT NULL DEFAULT 0,
  created_at TEXT,
  updated_at TEXT
);`;

export const CREATE_BILLS = `
CREATE TABLE IF NOT EXISTS bills (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  bill_number TEXT NOT NULL UNIQUE,
  customer_name TEXT,
  customer_phone TEXT,
  subtotal REAL NOT NULL,
  gst_total REAL NOT NULL,
  discount_total REAL NOT NULL DEFAULT 0,
  grand_total REAL NOT NULL,
  payment_mode TEXT NOT NULL,
  created_at TEXT NOT NULL
);`;

export const CREATE_BILL_ITEMS = `
CREATE TABLE IF NOT EXISTS bill_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  bill_id INTEGER NOT NULL,
  medicine_id INTEGER NOT NULL,
  medicine_name TEXT NOT NULL,
  batch_no TEXT,
  qty REAL NOT NULL,
  unit_price REAL NOT NULL,
  gst_percent REAL NOT NULL,
  gst_amount REAL NOT NULL,
  line_total REAL NOT NULL,
  FOREIGN KEY (bill_id) REFERENCES bills(id),
  FOREIGN KEY (medicine_id) REFERENCES medicines(id)
);`;

export const CREATE_APP_META = `
CREATE TABLE IF NOT EXISTS app_meta (
  key TEXT PRIMARY KEY,
  value TEXT
);`;
