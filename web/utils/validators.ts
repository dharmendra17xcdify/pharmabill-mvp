import { z } from 'zod';

export const settingsSchema = z.object({
  store_name: z.string().min(1, 'Store name is required'),
  owner_name: z.string().optional().default(''),
  phone: z.string().optional().default(''),
  address: z.string().optional().default(''),
  gstin: z.string().optional().default(''),
  drug_license: z.string().optional().default(''),
  invoice_prefix: z.string().min(1, 'Invoice prefix is required').default('MED'),
});

export const medicineSchema = z.object({
  name: z.string().min(1, 'Medicine name is required'),
  generic_name: z.string().optional().default(''),
  batch_no: z.string().optional().default(''),
  expiry_month: z.preprocess(
    (v) => (v === '' || v === null || v === undefined ? null : v),
    z.coerce.number().min(1).max(12).nullable().optional()
  ),
  expiry_year: z.preprocess(
    (v) => (v === '' || v === null || v === undefined ? null : v),
    z.coerce.number().min(2020).max(2050).nullable().optional()
  ),
  mrp: z.preprocess(
    (v) => (v === '' || v === null || v === undefined ? null : v),
    z.coerce.number().positive('MRP must be positive').nullable().optional()
  ),
  selling_price: z.preprocess(
    (v) => (v === '' || v === null || v === undefined ? null : v),
    z.coerce.number().positive('Selling price must be positive').nullable().optional()
  ),
  gst_percent: z.coerce.number().min(0).max(28).default(0),
  stock_qty: z.coerce.number().min(0, 'Stock cannot be negative').default(0),
  packing: z.string().optional().default(''),
  packing_qty: z.coerce.number().min(1, 'Must be at least 1').default(1),
  hsn: z.string().optional().default(''),
  rate: z.coerce.number().min(0, 'Rate cannot be negative').default(0),
  discount: z.coerce.number().min(0).max(100, 'Discount cannot exceed 100%').default(0),
  manufacture_name: z.string().optional().default(''),
  group: z.string().optional().default(''),
});

export type SettingsFormData = z.infer<typeof settingsSchema>;
export type MedicineFormData = z.infer<typeof medicineSchema>;
