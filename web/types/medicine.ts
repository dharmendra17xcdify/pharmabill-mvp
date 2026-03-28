export interface Medicine {
  id?: number;
  name: string;
  generic_name: string;
  batch_no: string;
  expiry_month: number | null;
  expiry_year: number | null;
  mrp: number;
  selling_price: number;
  gst_percent: number;
  stock_qty: number;
  hsn: string;
  rate: number;
  discount: number;
  manufacture_name: string;
  group: string;
  created_at?: string;
  updated_at?: string;
}
