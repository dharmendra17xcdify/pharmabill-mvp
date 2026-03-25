'use client';
import { create } from 'zustand';
import { CartItem } from '@/types/bill';
import { Medicine } from '@/types/medicine';
import { calcGST } from '@/utils/gst';

interface BillingStore {
  cartItems: CartItem[];
  addToCart: (medicine: Medicine, qty: number) => void;
  removeFromCart: (medicineId: number) => void;
  updateQty: (medicineId: number, qty: number) => void;
  clearCart: () => void;
  computeTotals: () => { subtotal: number; gstTotal: number; grandTotal: number };
}

export const useBillingStore = create<BillingStore>((set, get) => ({
  cartItems: [],

  addToCart: (medicine: Medicine, qty: number) => {
    const { lineTotal, gstAmount } = calcGST(medicine.selling_price, qty, medicine.gst_percent);
    const existing = get().cartItems.find(i => i.medicine_id === medicine.id!);
    if (existing) {
      set(state => ({
        cartItems: state.cartItems.map(i => {
          if (i.medicine_id !== medicine.id!) return i;
          const newQty = i.qty + qty;
          const { lineTotal: lt, gstAmount: ga } = calcGST(medicine.selling_price, newQty, medicine.gst_percent);
          return { ...i, qty: newQty, gst_amount: ga, line_total: lt };
        }),
      }));
    } else {
      set(state => ({
        cartItems: [
          ...state.cartItems,
          {
            medicine_id: medicine.id!,
            medicine_name: medicine.name,
            batch_no: medicine.batch_no,
            qty,
            unit_price: medicine.selling_price,
            mrp: medicine.mrp,
            gst_percent: medicine.gst_percent,
            gst_amount: gstAmount,
            line_total: lineTotal,
          },
        ],
      }));
    }
  },

  removeFromCart: (medicineId: number) => {
    set(state => ({ cartItems: state.cartItems.filter(i => i.medicine_id !== medicineId) }));
  },

  updateQty: (medicineId: number, qty: number) => {
    set(state => ({
      cartItems: state.cartItems.map(i => {
        if (i.medicine_id !== medicineId) return i;
        const { lineTotal, gstAmount } = calcGST(i.unit_price, qty, i.gst_percent);
        return { ...i, qty, gst_amount: gstAmount, line_total: lineTotal };
      }),
    }));
  },

  clearCart: () => set({ cartItems: [] }),

  computeTotals: () => {
    const items = get().cartItems;
    const gstTotal = parseFloat(items.reduce((s, i) => s + i.gst_amount, 0).toFixed(2));
    const grandTotal = parseFloat(items.reduce((s, i) => s + i.line_total, 0).toFixed(2));
    const subtotal = parseFloat((grandTotal - gstTotal).toFixed(2));
    return { subtotal, gstTotal, grandTotal };
  },
}));
