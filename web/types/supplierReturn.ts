export interface SupplierReturnItem {
  id?: number;
  return_id?: number;
  medicine_id: number | null;
  medicine_name: string;
  hsn: string;
  batch_no: string;
  expiry_month: number | null;
  expiry_year: number | null;
  packing: string;
  qty: number;
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
  return_reason: string;
}

export interface SupplierReturn {
  id?: number;
  return_number: string;
  supplier_name: string;
  supplier_invoice_no: string;
  credit_note_no: string;
  supplier_gstin: string;
  supplier_phone: string;
  supplier_address: string;
  supplier_drug_license: string;
  subtotal: number;
  cgst_total: number;
  sgst_total: number;
  grand_total: number;
  created_at: string;
}
