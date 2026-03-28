'use client';
import { create } from 'zustand';
import { CartItem } from '@/types/bill';
import { Medicine } from '@/types/medicine';
import { calcGST } from '@/utils/gst';

interface BillingStore {
  cartItems: CartItem[];
  addToCart: (medicine: Medicine, qty: number, isLoose?: boolean) => void;
  removeFromCart: (medicineId: number) => void;
  updateQty: (medicineId: number, qty: number) => void;
  clearCart: () => void;
  computeTotals: () => { subtotal: number; gstTotal: number; grandTotal: number };
}

export const useBillingStore = create<BillingStore>((set, get) => ({
  cartItems: [],

  addToCart: (medicine: Medicine, qty: number, isLoose = false) => {
    const packingQty = medicine.packing_qty && medicine.packing_qty > 1 ? medicine.packing_qty : 1;
    const unitPrice = isLoose
      ? parseFloat((medicine.selling_price / packingQty).toFixed(2))
      : medicine.selling_price;
    const { lineTotal, gstAmount } = calcGST(unitPrice, qty, medicine.gst_percent);
    const existing = get().cartItems.find(i => i.medicine_id === medicine.id!);
    if (existing) {
      set(state => ({
        cartItems: state.cartItems.map(i => {
          if (i.medicine_id !== medicine.id!) return i;
          const newQty = i.qty + qty;
          const { lineTotal: lt, gstAmount: ga } = calcGST(i.unit_price, newQty, i.gst_percent);
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
            hsn: medicine.hsn ?? '',
            expiry_month: medicine.expiry_month,
            expiry_year: medicine.expiry_year,
            manufacture_name: medicine.manufacture_name ?? '',
            is_loose: isLoose,
            qty,
            unit_price: unitPrice,
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
