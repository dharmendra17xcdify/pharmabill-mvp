import { create } from 'zustand';
import { CartItem } from '../types/bill';
import { Medicine } from '../types/medicine';
import { calcGST } from '../utils/gst';

interface Totals {
  subtotal: number;
  gstTotal: number;
  grandTotal: number;
}

interface BillingStore {
  cartItems: CartItem[];
  addToCart: (medicine: Medicine, qty?: number) => void;
  removeFromCart: (medicineId: number) => void;
  updateQty: (medicineId: number, qty: number) => void;
  clearCart: () => void;
  computeTotals: () => Totals;
}

export const useBillingStore = create<BillingStore>((set, get) => ({
  cartItems: [],

  addToCart: (medicine: Medicine, qty = 1) => {
    const existing = get().cartItems.find((i) => i.medicine_id === medicine.id!);
    if (existing) {
      get().updateQty(medicine.id!, existing.qty + qty);
      return;
    }
    const { lineTotal, taxable, gstAmount } = calcGST(medicine.selling_price, qty, medicine.gst_percent);
    const item: CartItem = {
      medicine_id: medicine.id!,
      medicine_name: medicine.name,
      batch_no: medicine.batch_no || '',
      qty,
      unit_price: medicine.selling_price,
      mrp: medicine.mrp,
      gst_percent: medicine.gst_percent,
      gst_amount: gstAmount,
      line_total: lineTotal,
    };
    set((state) => ({ cartItems: [...state.cartItems, item] }));
  },

  removeFromCart: (medicineId: number) => {
    set((state) => ({
      cartItems: state.cartItems.filter((i) => i.medicine_id !== medicineId),
    }));
  },

  updateQty: (medicineId: number, qty: number) => {
    if (qty <= 0) {
      get().removeFromCart(medicineId);
      return;
    }
    set((state) => ({
      cartItems: state.cartItems.map((item) => {
        if (item.medicine_id !== medicineId) return item;
        const { lineTotal, gstAmount } = calcGST(item.unit_price, qty, item.gst_percent);
        return { ...item, qty, gst_amount: gstAmount, line_total: lineTotal };
      }),
    }));
  },

  clearCart: () => set({ cartItems: [] }),

  computeTotals: (): Totals => {
    const items = get().cartItems;
    const gstTotal = parseFloat(items.reduce((sum, i) => sum + i.gst_amount, 0).toFixed(2));
    const grandTotal = parseFloat(items.reduce((sum, i) => sum + i.line_total, 0).toFixed(2));
    const subtotal = parseFloat((grandTotal - gstTotal).toFixed(2));
    return { subtotal, gstTotal, grandTotal };
  },
}));
