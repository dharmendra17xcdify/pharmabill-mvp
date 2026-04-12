export interface PurchaseItem {
  id?: number;
  purchase_id?: number;
  medicine_id: number | null;
  medicine_name: string;
  hsn: string;
  batch_no: string;
  expiry_month: number | null;
  expiry_year: number | null;
  packing: string;
  pack_qty: number;
  qty: number;
  deal_qty: number;
  rate: number;
  discount: number;
  cgst_percent: number;
  sgst_percent: number;
  cgst_amount: number;
  sgst_amount: number;
  taxable_amount: number;
  amount: number;
  mrp: number;
  manufacture_name: string;
}

export interface Purchase {
  id?: number;
  purchase_number: string;
  supplier_name: string;
  supplier_invoice_no: string;
  supplier_gstin: string;
  supplier_address: string;
  supplier_phone: string;
  supplier_drug_license: string;
  subtotal: number;
  cgst_total: number;
  sgst_total: number;
  discount_total: number;
  grand_total: number;
  payment_mode: string;
  notes: string;
  created_at: string;
}
