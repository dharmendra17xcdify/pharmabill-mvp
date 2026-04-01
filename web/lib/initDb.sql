-- PharmaBill Web — SQL Server schema initialisation
-- Run this script once against your SQL Server database before starting the app.

IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='store_settings' AND xtype='U')
CREATE TABLE store_settings (
  id            INT IDENTITY(1,1) PRIMARY KEY,
  store_name    NVARCHAR(255)  NOT NULL,
  owner_name    NVARCHAR(255)  NOT NULL DEFAULT '',
  phone         NVARCHAR(50)   NOT NULL DEFAULT '',
  address       NVARCHAR(500)  NOT NULL DEFAULT '',
  gstin         NVARCHAR(50)   NOT NULL DEFAULT '',
  drug_license  NVARCHAR(100)  NOT NULL DEFAULT '',
  invoice_prefix NVARCHAR(20)  NOT NULL DEFAULT 'MED',
  created_at    NVARCHAR(50),
  updated_at    NVARCHAR(50)
);

IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='medicines' AND xtype='U')
CREATE TABLE medicines (
  id               INT IDENTITY(1,1) PRIMARY KEY,
  name             NVARCHAR(255)  NOT NULL,
  generic_name     NVARCHAR(255)  NOT NULL DEFAULT '',
  batch_no         NVARCHAR(100)  NOT NULL DEFAULT '',
  expiry_month     INT            NULL,
  expiry_year      INT            NULL,
  mrp              DECIMAL(10,2)  NOT NULL,
  selling_price    DECIMAL(10,2)  NOT NULL,
  gst_percent      DECIMAL(5,2)   NOT NULL DEFAULT 0,
  stock_qty        INT            NOT NULL DEFAULT 0,
  packing          NVARCHAR(100)  NOT NULL DEFAULT '',
  packing_qty      INT            NOT NULL DEFAULT 1,
  hsn              NVARCHAR(50)   NOT NULL DEFAULT '',
  rate             DECIMAL(10,2)  NOT NULL DEFAULT 0,
  discount         DECIMAL(5,2)   NOT NULL DEFAULT 0,
  manufacture_name NVARCHAR(255)  NOT NULL DEFAULT '',
  [group]          NVARCHAR(100)  NOT NULL DEFAULT '',
  created_at       NVARCHAR(50),
  updated_at       NVARCHAR(50)
);

-- Add new columns to existing medicines table (idempotent)
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('medicines') AND name = 'packing')
  ALTER TABLE medicines ADD packing NVARCHAR(100) NOT NULL DEFAULT '';
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('medicines') AND name = 'packing_qty')
  ALTER TABLE medicines ADD packing_qty INT NOT NULL DEFAULT 1;
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('medicines') AND name = 'hsn')
  ALTER TABLE medicines ADD hsn NVARCHAR(50) NOT NULL DEFAULT '';
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('medicines') AND name = 'rate')
  ALTER TABLE medicines ADD rate DECIMAL(10,2) NOT NULL DEFAULT 0;
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('medicines') AND name = 'discount')
  ALTER TABLE medicines ADD discount DECIMAL(5,2) NOT NULL DEFAULT 0;
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('medicines') AND name = 'manufacture_name')
  ALTER TABLE medicines ADD manufacture_name NVARCHAR(255) NOT NULL DEFAULT '';
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('medicines') AND name = 'group')
  ALTER TABLE medicines ADD [group] NVARCHAR(100) NOT NULL DEFAULT '';

IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='bills' AND xtype='U')
CREATE TABLE bills (
  id             INT IDENTITY(1,1) PRIMARY KEY,
  bill_number    NVARCHAR(50)   NOT NULL UNIQUE,
  customer_name    NVARCHAR(255)  NOT NULL DEFAULT '',
  customer_phone   NVARCHAR(50)   NOT NULL DEFAULT '',
  customer_address NVARCHAR(500)  NOT NULL DEFAULT '',
  doctor_name      NVARCHAR(255)  NOT NULL DEFAULT '',
  subtotal         DECIMAL(10,2)  NOT NULL DEFAULT 0,
  gst_total        DECIMAL(10,2)  NOT NULL DEFAULT 0,
  discount_percent DECIMAL(5,2)   NOT NULL DEFAULT 0,
  discount_total   DECIMAL(10,2)  NOT NULL DEFAULT 0,
  grand_total    DECIMAL(10,2)  NOT NULL DEFAULT 0,
  payment_mode   NVARCHAR(20)   NOT NULL DEFAULT 'Cash',
  created_at     NVARCHAR(50)
);

-- Add new columns to existing bills table
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('bills') AND name = 'doctor_name')
  ALTER TABLE bills ADD doctor_name NVARCHAR(255) NOT NULL DEFAULT '';
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('bills') AND name = 'discount_percent')
  ALTER TABLE bills ADD discount_percent DECIMAL(5,2) NOT NULL DEFAULT 0;
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('bills') AND name = 'customer_address')
  ALTER TABLE bills ADD customer_address NVARCHAR(500) NOT NULL DEFAULT '';

IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='bill_items' AND xtype='U')
CREATE TABLE bill_items (
  id               INT IDENTITY(1,1) PRIMARY KEY,
  bill_id          INT            NOT NULL REFERENCES bills(id),
  medicine_id      INT,
  medicine_name    NVARCHAR(255)  NOT NULL,
  batch_no         NVARCHAR(100)  NOT NULL DEFAULT '',
  hsn              NVARCHAR(50)   NOT NULL DEFAULT '',
  expiry_month     INT            NULL,
  expiry_year      INT            NULL,
  manufacture_name NVARCHAR(255)  NOT NULL DEFAULT '',
  qty              INT            NOT NULL,
  unit_price       DECIMAL(10,2)  NOT NULL,
  gst_percent      DECIMAL(5,2)   NOT NULL DEFAULT 0,
  gst_amount       DECIMAL(10,2)  NOT NULL DEFAULT 0,
  line_total       DECIMAL(10,2)  NOT NULL
);

-- Add new columns to existing bill_items table
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('bill_items') AND name = 'hsn')
  ALTER TABLE bill_items ADD hsn NVARCHAR(50) NOT NULL DEFAULT '';
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('bill_items') AND name = 'expiry_month')
  ALTER TABLE bill_items ADD expiry_month INT NULL;
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('bill_items') AND name = 'expiry_year')
  ALTER TABLE bill_items ADD expiry_year INT NULL;
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('bill_items') AND name = 'manufacture_name')
  ALTER TABLE bill_items ADD manufacture_name NVARCHAR(255) NOT NULL DEFAULT '';
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('bill_items') AND name = 'is_loose')
  ALTER TABLE bill_items ADD is_loose BIT NOT NULL DEFAULT 0;

IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='app_meta' AND xtype='U')
CREATE TABLE app_meta (
  [key]  NVARCHAR(100) PRIMARY KEY,
  value  NVARCHAR(500) NOT NULL DEFAULT ''
);

-- Seed the invoice counter
IF NOT EXISTS (SELECT 1 FROM app_meta WHERE [key] = 'last_invoice_number')
  INSERT INTO app_meta ([key], value) VALUES ('last_invoice_number', '0');

IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='purchases' AND xtype='U')
CREATE TABLE purchases (
  id INT IDENTITY(1,1) PRIMARY KEY,
  purchase_number NVARCHAR(50) NOT NULL,
  supplier_name NVARCHAR(255) NOT NULL DEFAULT '',
  supplier_invoice_no NVARCHAR(100) NOT NULL DEFAULT '',
  supplier_gstin NVARCHAR(50) NOT NULL DEFAULT '',
  supplier_address NVARCHAR(500) NOT NULL DEFAULT '',
  supplier_phone NVARCHAR(50) NOT NULL DEFAULT '',
  supplier_drug_license NVARCHAR(100) NOT NULL DEFAULT '',
  subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
  cgst_total DECIMAL(10,2) NOT NULL DEFAULT 0,
  sgst_total DECIMAL(10,2) NOT NULL DEFAULT 0,
  discount_total DECIMAL(10,2) NOT NULL DEFAULT 0,
  grand_total DECIMAL(10,2) NOT NULL DEFAULT 0,
  payment_mode NVARCHAR(20) NOT NULL DEFAULT 'Cash',
  created_at NVARCHAR(50) NOT NULL DEFAULT ''
);

IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='purchase_items' AND xtype='U')
CREATE TABLE purchase_items (
  id INT IDENTITY(1,1) PRIMARY KEY,
  purchase_id INT NOT NULL REFERENCES purchases(id),
  medicine_id INT NULL,
  medicine_name NVARCHAR(255) NOT NULL DEFAULT '',
  hsn NVARCHAR(50) NOT NULL DEFAULT '',
  batch_no NVARCHAR(100) NOT NULL DEFAULT '',
  expiry_month INT NULL,
  expiry_year INT NULL,
  packing NVARCHAR(100) NOT NULL DEFAULT '',
  pack_qty INT NOT NULL DEFAULT 1,
  qty INT NOT NULL DEFAULT 0,
  deal_qty INT NOT NULL DEFAULT 0,
  rate DECIMAL(10,2) NOT NULL DEFAULT 0,
  discount DECIMAL(5,2) NOT NULL DEFAULT 0,
  cgst_percent DECIMAL(5,2) NOT NULL DEFAULT 0,
  sgst_percent DECIMAL(5,2) NOT NULL DEFAULT 0,
  cgst_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  sgst_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  taxable_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  mrp DECIMAL(10,2) NOT NULL DEFAULT 0,
  manufacture_name NVARCHAR(255) NOT NULL DEFAULT ''
);

-- Add new supplier columns to existing purchases table
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('purchases') AND name = 'supplier_address')
  ALTER TABLE purchases ADD supplier_address NVARCHAR(500) NOT NULL DEFAULT '';
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('purchases') AND name = 'supplier_phone')
  ALTER TABLE purchases ADD supplier_phone NVARCHAR(50) NOT NULL DEFAULT '';
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('purchases') AND name = 'supplier_drug_license')
  ALTER TABLE purchases ADD supplier_drug_license NVARCHAR(100) NOT NULL DEFAULT '';

-- Add hsn to existing purchase_items table
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('purchase_items') AND name = 'hsn')
  ALTER TABLE purchase_items ADD hsn NVARCHAR(50) NOT NULL DEFAULT '';

IF NOT EXISTS (SELECT 1 FROM app_meta WHERE [key] = 'last_purchase_number')
  INSERT INTO app_meta ([key], value) VALUES ('last_purchase_number', '0');

IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='supplier_returns' AND xtype='U')
CREATE TABLE supplier_returns (
  id INT IDENTITY(1,1) PRIMARY KEY,
  return_number NVARCHAR(50) NOT NULL,
  supplier_name NVARCHAR(255) NOT NULL DEFAULT '',
  supplier_invoice_no NVARCHAR(100) NOT NULL DEFAULT '',
  credit_note_no NVARCHAR(100) NOT NULL DEFAULT '',
  supplier_gstin NVARCHAR(50) NOT NULL DEFAULT '',
  supplier_phone NVARCHAR(50) NOT NULL DEFAULT '',
  subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
  cgst_total DECIMAL(10,2) NOT NULL DEFAULT 0,
  sgst_total DECIMAL(10,2) NOT NULL DEFAULT 0,
  grand_total DECIMAL(10,2) NOT NULL DEFAULT 0,
  created_at NVARCHAR(50) NOT NULL DEFAULT ''
);

IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='supplier_return_items' AND xtype='U')
CREATE TABLE supplier_return_items (
  id INT IDENTITY(1,1) PRIMARY KEY,
  return_id INT NOT NULL REFERENCES supplier_returns(id),
  medicine_id INT NULL,
  medicine_name NVARCHAR(255) NOT NULL DEFAULT '',
  hsn NVARCHAR(50) NOT NULL DEFAULT '',
  batch_no NVARCHAR(100) NOT NULL DEFAULT '',
  expiry_month INT NULL,
  expiry_year INT NULL,
  packing NVARCHAR(100) NOT NULL DEFAULT '',
  qty INT NOT NULL DEFAULT 0,
  rate DECIMAL(10,2) NOT NULL DEFAULT 0,
  discount DECIMAL(5,2) NOT NULL DEFAULT 0,
  cgst_percent DECIMAL(5,2) NOT NULL DEFAULT 0,
  sgst_percent DECIMAL(5,2) NOT NULL DEFAULT 0,
  cgst_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  sgst_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  taxable_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  mrp DECIMAL(10,2) NOT NULL DEFAULT 0,
  manufacture_name NVARCHAR(255) NOT NULL DEFAULT '',
  return_reason NVARCHAR(100) NOT NULL DEFAULT 'Expired'
);

IF NOT EXISTS (SELECT 1 FROM app_meta WHERE [key] = 'last_return_number')
  INSERT INTO app_meta ([key], value) VALUES ('last_return_number', '0');

-- Add address and drug license to existing supplier_returns table
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('supplier_returns') AND name = 'supplier_address')
  ALTER TABLE supplier_returns ADD supplier_address NVARCHAR(500) NOT NULL DEFAULT '';
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('supplier_returns') AND name = 'supplier_drug_license')
  ALTER TABLE supplier_returns ADD supplier_drug_license NVARCHAR(100) NOT NULL DEFAULT '';

-- ─────────────────────────────────────────────────────────────────────────────
-- medicine_batches: per-batch inventory tracking
--   Each physical batch (distinct batch_no + expiry + MRP) is a separate row.
--   The medicines table remains the catalogue; all pricing/stock lives here.
-- ─────────────────────────────────────────────────────────────────────────────
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='medicine_batches' AND xtype='U')
CREATE TABLE medicine_batches (
  id            INT IDENTITY(1,1) PRIMARY KEY,
  medicine_id   INT            NOT NULL REFERENCES medicines(id) ON DELETE CASCADE,
  batch_no      NVARCHAR(100)  NOT NULL DEFAULT '',
  expiry_month  INT            NULL,
  expiry_year   INT            NULL,
  mrp           DECIMAL(10,2)  NOT NULL DEFAULT 0,
  selling_price DECIMAL(10,2)  NOT NULL DEFAULT 0,
  rate          DECIMAL(10,2)  NOT NULL DEFAULT 0,   -- purchase / cost price
  discount      DECIMAL(5,2)   NOT NULL DEFAULT 0,
  stock_qty     INT            NOT NULL DEFAULT 0,
  created_at    NVARCHAR(50)   NOT NULL DEFAULT ''
);

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name='IX_medicine_batches_medicine_id' AND object_id = OBJECT_ID('medicine_batches'))
  CREATE INDEX IX_medicine_batches_medicine_id ON medicine_batches(medicine_id);

-- Migrate existing medicine records into medicine_batches (idempotent).
-- Only migrates medicines that have meaningful data and no batch entry yet.
INSERT INTO medicine_batches
  (medicine_id, batch_no, expiry_month, expiry_year, mrp, selling_price, rate, discount, stock_qty, created_at)
SELECT
  id,
  ISNULL(batch_no,       ''),
  expiry_month,
  expiry_year,
  ISNULL(mrp,            0),
  ISNULL(selling_price,  0),
  ISNULL(rate,           0),
  ISNULL(discount,       0),
  ISNULL(stock_qty,      0),
  ISNULL(created_at,     '')
FROM medicines m
WHERE NOT EXISTS (
  SELECT 1 FROM medicine_batches mb WHERE mb.medicine_id = m.id
)
AND (ISNULL(mrp, 0) > 0 OR ISNULL(selling_price, 0) > 0 OR ISNULL(stock_qty, 0) > 0);
