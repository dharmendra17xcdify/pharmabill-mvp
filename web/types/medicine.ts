/** Catalogue-level medicine record (one per drug/product, batch-agnostic). */
export interface Medicine {
  id?: number;        // medicines.id — the catalogue primary key
  batch_id?: number;  // medicine_batches.id — populated when the record is a JOIN row

  // Catalogue fields (stored in medicines table)
  name: string;
  generic_name: string;
  gst_percent: number;
  packing: string;
  packing_qty: number;
  hsn: string;
  manufacture_name: string;
  group: string;
  created_at?: string;
  updated_at?: string;

  // Batch-specific fields (stored in medicine_batches; may be defaults when no batch)
  batch_no: string;
  expiry_month: number | null;
  expiry_year: number | null;
  mrp: number;
  selling_price: number;
  rate: number;      // purchase / cost price
  discount: number;
  stock_qty: number;
}

/** A single batch record from the medicine_batches table. */
export interface MedicineBatch {
  id?: number;
  medicine_id: number;
  batch_no: string;
  expiry_month: number | null;
  expiry_year: number | null;
  mrp: number;
  selling_price: number;
  rate: number;
  discount: number;
  stock_qty: number;
  created_at?: string;
}
