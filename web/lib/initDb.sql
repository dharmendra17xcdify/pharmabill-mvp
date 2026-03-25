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
  id            INT IDENTITY(1,1) PRIMARY KEY,
  name          NVARCHAR(255)  NOT NULL,
  generic_name  NVARCHAR(255)  NOT NULL DEFAULT '',
  batch_no      NVARCHAR(100)  NOT NULL DEFAULT '',
  expiry_month  INT            NULL,
  expiry_year   INT            NULL,
  mrp           DECIMAL(10,2)  NOT NULL,
  selling_price DECIMAL(10,2)  NOT NULL,
  gst_percent   DECIMAL(5,2)   NOT NULL DEFAULT 0,
  stock_qty     INT            NOT NULL DEFAULT 0,
  created_at    NVARCHAR(50),
  updated_at    NVARCHAR(50)
);

IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='bills' AND xtype='U')
CREATE TABLE bills (
  id             INT IDENTITY(1,1) PRIMARY KEY,
  bill_number    NVARCHAR(50)   NOT NULL UNIQUE,
  customer_name  NVARCHAR(255)  NOT NULL DEFAULT '',
  customer_phone NVARCHAR(50)   NOT NULL DEFAULT '',
  subtotal       DECIMAL(10,2)  NOT NULL DEFAULT 0,
  gst_total      DECIMAL(10,2)  NOT NULL DEFAULT 0,
  discount_total DECIMAL(10,2)  NOT NULL DEFAULT 0,
  grand_total    DECIMAL(10,2)  NOT NULL DEFAULT 0,
  payment_mode   NVARCHAR(20)   NOT NULL DEFAULT 'Cash',
  created_at     NVARCHAR(50)
);

IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='bill_items' AND xtype='U')
CREATE TABLE bill_items (
  id             INT IDENTITY(1,1) PRIMARY KEY,
  bill_id        INT            NOT NULL REFERENCES bills(id),
  medicine_id    INT,
  medicine_name  NVARCHAR(255)  NOT NULL,
  batch_no       NVARCHAR(100)  NOT NULL DEFAULT '',
  qty            INT            NOT NULL,
  unit_price     DECIMAL(10,2)  NOT NULL,
  gst_percent    DECIMAL(5,2)   NOT NULL DEFAULT 0,
  gst_amount     DECIMAL(10,2)  NOT NULL DEFAULT 0,
  line_total     DECIMAL(10,2)  NOT NULL
);

IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='app_meta' AND xtype='U')
CREATE TABLE app_meta (
  [key]  NVARCHAR(100) PRIMARY KEY,
  value  NVARCHAR(500) NOT NULL DEFAULT ''
);

-- Seed the invoice counter
IF NOT EXISTS (SELECT 1 FROM app_meta WHERE [key] = 'last_invoice_number')
  INSERT INTO app_meta ([key], value) VALUES ('last_invoice_number', '0');
