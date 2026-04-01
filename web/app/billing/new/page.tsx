'use client';
import { useEffect, useRef, useState } from 'react';
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
  const [customerAddress, setCustomerAddress] = useState('');
  const [doctorName, setDoctorName] = useState('');
  const [discountPercent, setDiscountPercent] = useState(0);
  const [paymentMode, setPaymentMode] = useState('Cash');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [qtyInputs, setQtyInputs] = useState<Record<number, number>>({});
  const [looseInputs, setLooseInputs] = useState<Record<number, boolean>>({});
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => { loadMedicines(); return () => clearCart(); }, []);

  useEffect(() => {
    if (!query.trim()) { setResults([]); setSelectedIndex(-1); return; }
    const q = query.toLowerCase();
    const filtered = medicines
      .filter(m => m.name.toLowerCase().includes(q) || m.generic_name.toLowerCase().includes(q))
      .slice(0, 10);
    setResults(filtered);
    setSelectedIndex(filtered.length > 0 ? 0 : -1);
  }, [query, medicines]);

  const handleAdd = (medicine: Medicine) => {
    const qty = qtyInputs[medicine.id!] ?? 1;
    const isLoose = looseInputs[medicine.id!] ?? false;
    addToCart(medicine, qty, isLoose);
    setQuery('');
    setResults([]);
    setSelectedIndex(-1);
    searchRef.current?.focus();
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!results.length) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(i => (i + 1) % results.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(i => (i - 1 + results.length) % results.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const m = results[selectedIndex >= 0 ? selectedIndex : 0];
      if (m && m.stock_qty > 0) handleAdd(m);
    } else if (e.key === 'Escape') {
      setResults([]);
      setSelectedIndex(-1);
    }
  };

  const { subtotal, gstTotal, grandTotal } = computeTotals();
  const discountAmt = parseFloat((grandTotal * discountPercent / 100).toFixed(2));
  const finalTotal = parseFloat((grandTotal - discountAmt).toFixed(2));

  const handleSubmit = async () => {
    if (cartItems.length === 0) return alert('Cart is empty');
    if (discountPercent < 0 || discountPercent > 100) return alert('Discount must be between 0% and 100%');
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/bills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bill: {
            customer_name: customerName,
            customer_phone: customerPhone,
            customer_address: customerAddress,
            doctor_name: doctorName,
            subtotal,
            gst_total: gstTotal,
            discount_percent: discountPercent,
            discount_total: discountAmt,
            grand_total: finalTotal,
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
            <h3 className="font-semibold text-gray-700 mb-3">Add Items</h3>
            <div className="flex gap-2">
              <input
                ref={searchRef}
                className="input"
                placeholder="Search medicine by name…"
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                autoComplete="off"
              />
            </div>

            {results.length > 0 && (
              <div className="mt-2 border border-gray-200 rounded-md overflow-hidden">
                {results.map((m, idx) => {
                  const isLoose = looseInputs[m.id!] ?? false;
                  const packingQty = m.packing_qty && m.packing_qty > 1 ? m.packing_qty : 1;
                  const displayPrice = isLoose
                    ? parseFloat((Number(m.selling_price) / packingQty).toFixed(2))
                    : Number(m.selling_price);
                  const isSelected = idx === selectedIndex;
                  return (
                    <div
                      key={`${m.id}-${m.batch_id ?? idx}`}
                      className={`flex items-center justify-between p-2 border-b last:border-b-0 cursor-pointer transition-colors ${
                        isSelected ? 'bg-blue-50 border-l-2 border-l-primary' : 'hover:bg-gray-50'
                      } ${m.stock_qty === 0 ? 'opacity-50' : ''}`}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      onClick={() => m.stock_qty > 0 && handleAdd(m)}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium">{m.name}</div>
                        {m.generic_name && <div className="text-xs text-gray-400">{m.generic_name}</div>}
                        <div className="text-xs text-gray-500">
                          {m.packing && <span className="mr-1">{m.packing} ·</span>}
                          {m.batch_no && <span className="mr-1">Batch: {m.batch_no} ·</span>}
                          {formatINR(displayPrice)}{isLoose ? '/tablet' : '/strip'} · Stock: {m.stock_qty}
                        </div>
                      </div>
                      {/* Controls — stopPropagation so clicks here don't trigger the row click */}
                      <div
                        className="flex items-center gap-2 ml-2 shrink-0"
                        onClick={e => e.stopPropagation()}
                      >
                        {packingQty > 1 && (
                          <button
                            type="button"
                            onClick={() => setLooseInputs(prev => ({ ...prev, [m.id!]: !isLoose }))}
                            className={`text-xs px-2 py-1 rounded border font-medium transition-colors ${
                              isLoose
                                ? 'bg-warning text-white border-warning'
                                : 'bg-white text-gray-500 border-gray-300 hover:border-warning hover:text-warning'
                            }`}
                          >
                            Loose
                          </button>
                        )}
                        <input
                          type="number"
                          min={1}
                          max={isLoose ? m.stock_qty * packingQty : m.stock_qty}
                          defaultValue={1}
                          className="input w-16 text-center text-sm"
                          onChange={e => setQtyInputs(prev => ({ ...prev, [m.id!]: Number(e.target.value) }))}
                        />
                        <button
                          onClick={() => m.stock_qty > 0 && handleAdd(m)}
                          className="btn-primary text-xs px-3 py-1"
                          disabled={m.stock_qty === 0}
                        >
                          Add
                        </button>
                      </div>
                    </div>
                  );
                })}
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
              <label className="label">Address</label>
              <input className="input" placeholder="Optional" value={customerAddress} onChange={e => setCustomerAddress(e.target.value)} />
            </div>
            <div>
              <label className="label">Doctor Name</label>
              <input className="input" placeholder="Optional" value={doctorName} onChange={e => setDoctorName(e.target.value)} />
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
                        <div className="flex items-center gap-1">
                          <div className="text-sm font-medium">{item.medicine_name}</div>
                          {item.is_loose && (
                            <span className="text-xs bg-warning/10 text-warning border border-warning/30 rounded px-1">Loose</span>
                          )}
                        </div>
                        <div className="text-xs text-gray-400">
                          {formatINR(item.unit_price)} × {item.qty}{item.is_loose ? ' tab' : ''} = {formatINR(item.line_total)}
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
            <div className="flex items-center justify-between text-sm text-gray-600 border-t pt-2">
              <span>Discount %</span>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min={0}
                  max={100}
                  step="0.01"
                  value={discountPercent || ''}
                  onChange={e => setDiscountPercent(parseFloat(e.target.value) || 0)}
                  className="input w-20 text-right text-sm py-1"
                  placeholder="0"
                />
                <span className="text-gray-500">%</span>
                {discountAmt > 0 && <span className="text-xs text-success ml-1">− {formatINR(discountAmt)}</span>}
              </div>
            </div>
            <div className="flex justify-between text-base font-bold text-primary border-t pt-2">
              <span>Grand Total</span><span>{formatINR(finalTotal)}</span>
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
