export interface BillItem {
  id?: number;
  bill_id?: number;
  medicine_id: number;
  medicine_name: string;
  batch_no: string;
  qty: number;
  unit_price: number;
  gst_percent: number;
  gst_amount: number;
  line_total: number;
}

export interface Bill {
  id?: number;
  bill_number: string;
  customer_name: string;
  customer_phone: string;
  subtotal: number;
  gst_total: number;
  discount_total: number;
  grand_total: number;
  payment_mode: string;
  created_at: string;
  items?: BillItem[];
}

export interface CartItem {
  medicine_id: number;
  medicine_name: string;
  batch_no: string;
  qty: number;
  unit_price: number;
  mrp: number;
  gst_percent: number;
  gst_amount: number;
  line_total: number;
}
