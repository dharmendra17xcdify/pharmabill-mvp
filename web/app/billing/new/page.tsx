'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useBillingStore } from '@/store/useBillingStore';
import { useMedicineStore } from '@/store/useMedicineStore';
import { formatINR } from '@/utils/currency';
import { PAYMENT_MODES } from '@/constants/paymentModes';
import { Medicine } from '@/types/medicine';

export default function NewBillPage() {
  const router = useRouter();
  const { medicines, loadMedicines } = useMedicineStore();
  const { cartItems, addToCart, removeFromCart, updateQty, clearCart, computeTotals } = useBillingStore();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Medicine[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [paymentMode, setPaymentMode] = useState('Cash');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [qtyInputs, setQtyInputs] = useState<Record<number, number>>({});

  useEffect(() => { loadMedicines(); return () => clearCart(); }, []);

  useEffect(() => {
    if (!query.trim()) { setResults([]); return; }
    const q = query.toLowerCase();
    setResults(
      medicines.filter(
        m => m.name.toLowerCase().includes(q) || m.generic_name.toLowerCase().includes(q)
      ).slice(0, 10)
    );
  }, [query, medicines]);

  const handleAdd = (medicine: Medicine) => {
    const qty = qtyInputs[medicine.id!] ?? 1;
    addToCart(medicine, qty);
    setQuery('');
    setResults([]);
  };

  const { subtotal, gstTotal, grandTotal } = computeTotals();

  const handleSubmit = async () => {
    if (cartItems.length === 0) return alert('Cart is empty');
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/bills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bill: {
            customer_name: customerName,
            customer_phone: customerPhone,
            subtotal,
            gst_total: gstTotal,
            discount_total: 0,
            grand_total: grandTotal,
            payment_mode: paymentMode,
          },
          items: cartItems,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      clearCart();
      router.push(`/bills/${data.id}`);
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Failed to save bill');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-gray-800">New Bill</h2>

      <div className="flex gap-4 items-start">
        {/* Left: search */}
        <div className="flex-1 space-y-4">
          <div className="card">
            <h3 className="font-semibold text-gray-700 mb-3">Add Medicines</h3>
            <div className="flex gap-2">
              <input
                className="input"
                placeholder="Search medicine by name…"
                value={query}
                onChange={e => setQuery(e.target.value)}
              />
            </div>

            {results.length > 0 && (
              <div className="mt-2 border border-gray-200 rounded-md overflow-hidden">
                {results.map(m => (
                  <div
                    key={m.id}
                    className="flex items-center justify-between p-2 hover:bg-gray-50 border-b last:border-b-0"
                  >
                    <div>
                      <div className="text-sm font-medium">{m.name}</div>
                      {m.generic_name && <div className="text-xs text-gray-400">{m.generic_name}</div>}
                      <div className="text-xs text-gray-500">
                        {formatINR(Number(m.selling_price))} · Stock: {m.stock_qty}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={1}
                        max={m.stock_qty}
                        defaultValue={1}
                        className="input w-16 text-center text-sm"
                        onChange={e => setQtyInputs(prev => ({ ...prev, [m.id!]: Number(e.target.value) }))}
                      />
                      <button
                        onClick={() => handleAdd(m)}
                        className="btn-primary text-xs px-3 py-1"
                        disabled={m.stock_qty === 0}
                      >
                        Add
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Customer & payment */}
          <div className="card space-y-3">
            <h3 className="font-semibold text-gray-700">Customer & Payment</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Customer Name</label>
                <input className="input" placeholder="Optional" value={customerName} onChange={e => setCustomerName(e.target.value)} />
              </div>
              <div>
                <label className="label">Phone</label>
                <input className="input" placeholder="Optional" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} />
              </div>
            </div>
            <div>
              <label className="label">Payment Mode</label>
              <div className="flex gap-2">
                {PAYMENT_MODES.map(mode => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setPaymentMode(mode)}
                    className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                      paymentMode === mode
                        ? 'bg-primary text-white border-primary'
                        : 'bg-white text-gray-600 border-gray-300 hover:border-primary'
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right: cart */}
        <div className="w-80 space-y-4">
          <div className="card">
            <h3 className="font-semibold text-gray-700 mb-3">Cart ({cartItems.length})</h3>

            {cartItems.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-4">No items added yet</p>
            ) : (
              <div className="space-y-2">
                {cartItems.map(item => (
                  <div key={item.medicine_id} className="border border-gray-100 rounded p-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="text-sm font-medium">{item.medicine_name}</div>
                        <div className="text-xs text-gray-400">
                          {formatINR(item.unit_price)} × {item.qty} = {formatINR(item.line_total)}
                        </div>
                        <div className="text-xs text-gray-400">GST: {formatINR(item.gst_amount)}</div>
                      </div>
                      <button
                        onClick={() => removeFromCart(item.medicine_id)}
                        className="text-danger text-xs hover:underline ml-2"
                      >
                        ✕
                      </button>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <button
                        onClick={() => item.qty > 1 && updateQty(item.medicine_id, item.qty - 1)}
                        className="w-6 h-6 rounded border text-sm font-bold text-gray-600 hover:bg-gray-100"
                      >−</button>
                      <span className="text-sm w-6 text-center">{item.qty}</span>
                      <button
                        onClick={() => updateQty(item.medicine_id, item.qty + 1)}
                        className="w-6 h-6 rounded border text-sm font-bold text-gray-600 hover:bg-gray-100"
                      >+</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Totals */}
          <div className="card space-y-2">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Subtotal (taxable)</span><span>{formatINR(subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-600">
              <span>GST Total</span><span>{formatINR(gstTotal)}</span>
            </div>
            <div className="flex justify-between text-base font-bold text-primary border-t pt-2">
              <span>Grand Total</span><span>{formatINR(grandTotal)}</span>
            </div>

            <button
              onClick={handleSubmit}
              className="btn-primary w-full mt-2"
              disabled={isSubmitting || cartItems.length === 0}
            >
              {isSubmitting ? 'Saving…' : 'Save Bill'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
