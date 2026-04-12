'use client';
import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useMedicineStore } from '@/store/useMedicineStore';
import { formatINR } from '@/utils/currency';
import { PAYMENT_MODES } from '@/constants/paymentModes';
import { Medicine } from '@/types/medicine';

interface EditItem {
  key: string;
  medicine_id: number;
  medicine_name: string;
  batch_no: string;
  hsn: string;
  expiry_month: number | null;
  expiry_year: number | null;
  manufacture_name: string;
  is_loose: boolean;
  qty: number;
  unit_price: number;
  gst_percent: number;
  gst_amount: number;
  line_total: number;
  group: string;
}

function calcItem(item: EditItem): EditItem {
  const line_total = parseFloat((item.qty * item.unit_price).toFixed(2));
  return { ...item, gst_amount: 0, line_total };
}

export default function EditBillPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { medicines, loadMedicines } = useMedicineStore();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [billNumber, setBillNumber] = useState('');
  const [billDate, setBillDate] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [doctorName, setDoctorName] = useState('');
  const [paymentMode, setPaymentMode] = useState('Cash');
  const [discountPercent, setDiscountPercent] = useState(0);
  const [items, setItems] = useState<EditItem[]>([]);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Medicine[]>([]);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadMedicines();
    fetch(`/api/bills/${id}`)
      .then(r => r.json())
      .then(data => {
        setBillNumber(data.bill_number);
        setBillDate(data.created_at ? data.created_at.slice(0, 10) : new Date().toISOString().slice(0, 10));
        setCustomerName(data.customer_name || '');
        setCustomerPhone(data.customer_phone || '');
        setCustomerAddress(data.customer_address || '');
        setDoctorName(data.doctor_name || '');
        setPaymentMode(data.payment_mode || 'Cash');
        setDiscountPercent(Number(data.discount_percent) || 0);
        setItems((data.items ?? []).map((it: any, idx: number) => ({
          key: String(idx),
          medicine_id: it.medicine_id,
          medicine_name: it.medicine_name,
          batch_no: it.batch_no || '',
          hsn: it.hsn || '',
          expiry_month: it.expiry_month ?? null,
          expiry_year: it.expiry_year ?? null,
          manufacture_name: it.manufacture_name || '',
          is_loose: !!it.is_loose,
          qty: it.qty,
          unit_price: Number(it.unit_price),
          gst_percent: Number(it.gst_percent),
          gst_amount: Number(it.gst_amount),
          line_total: Number(it.line_total),
          group: it.group || '',
        })));
      })
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!query.trim()) { setResults([]); return; }
    const q = query.toLowerCase();
    setResults(medicines.filter(m => m.name.toLowerCase().includes(q) || m.generic_name.toLowerCase().includes(q)).slice(0, 8));
  }, [query, medicines]);

  const addItem = (med: Medicine) => {
    const newItem: EditItem = {
      key: Math.random().toString(36).slice(2),
      medicine_id: med.id!,
      medicine_name: med.name,
      batch_no: med.batch_no || '',
      hsn: med.hsn || '',
      expiry_month: med.expiry_month ?? null,
      expiry_year: med.expiry_year ?? null,
      manufacture_name: med.manufacture_name || '',
      is_loose: false,
      qty: 1,
      unit_price: Number(med.selling_price),
      gst_percent: Number(med.gst_percent),
      gst_amount: 0,
      line_total: 0,
      group: med.group || '',
    };
    setItems(prev => [...prev, calcItem(newItem)]);
    setQuery('');
    setResults([]);
    searchRef.current?.focus();
  };

  const updateItem = (key: string, patch: Partial<EditItem>) => {
    setItems(prev => prev.map(it => it.key === key ? calcItem({ ...it, ...patch }) : it));
  };

  const removeItem = (key: string) => setItems(prev => prev.filter(it => it.key !== key));

  const subtotal = items.reduce((s, it) => s + it.line_total, 0);
  // Discount applies only to non-General category items
  const discountableTotal = parseFloat(items
    .filter(it => it.group !== 'General')
    .reduce((s, it) => s + it.line_total, 0).toFixed(2));
  const discountAmt = parseFloat((discountableTotal * discountPercent / 100).toFixed(2));
  const grandTotal = parseFloat((subtotal - discountAmt).toFixed(2));

  const handleSave = async () => {
    if (items.length === 0) return alert('Add at least one item');
    setSaving(true);
    try {
      const res = await fetch(`/api/bills/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bill: {
            customer_name: customerName,
            customer_phone: customerPhone,
            customer_address: customerAddress,
            doctor_name: doctorName,
            subtotal: parseFloat(subtotal.toFixed(2)),
            gst_total: 0,
            discount_percent: discountPercent,
            discount_total: discountAmt,
            grand_total: grandTotal,
            payment_mode: paymentMode,
            bill_date: billDate,
          },
          items: items.map(it => ({
            medicine_id: it.medicine_id,
            medicine_name: it.medicine_name,
            batch_no: it.batch_no,
            hsn: it.hsn,
            expiry_month: it.expiry_month,
            expiry_year: it.expiry_year,
            manufacture_name: it.manufacture_name,
            is_loose: it.is_loose,
            qty: it.qty,
            unit_price: it.unit_price,
            gst_percent: it.gst_percent,
            gst_amount: it.gst_amount,
            line_total: it.line_total,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      router.push(`/bills/${id}`);
    } catch (e: any) {
      alert(e.message || 'Failed to save');
      setSaving(false);
    }
  };

  if (loading) return <div className="text-center py-12 text-gray-400">Loading…</div>;

  return (
    <div className="space-y-4 max-w-4xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="text-primary hover:underline text-sm">← Back</button>
          <h2 className="text-xl font-bold text-gray-800">Edit Bill {billNumber}</h2>
        </div>
        <div className="flex gap-2">
          <button onClick={() => router.back()} className="btn-secondary text-sm">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="btn-primary text-sm">
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* Customer & Payment */}
      <div className="card">
        <h3 className="font-semibold text-gray-700 mb-3">Customer & Payment</h3>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label className="label">Customer Name</label>
            <input className="input" value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="Optional" />
          </div>
          <div>
            <label className="label">Phone</label>
            <input className="input" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} placeholder="Optional" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label className="label">Address</label>
            <input className="input" value={customerAddress} onChange={e => setCustomerAddress(e.target.value)} placeholder="Optional" />
          </div>
          <div>
            <label className="label">Doctor Name</label>
            <input className="input" value={doctorName} onChange={e => setDoctorName(e.target.value)} placeholder="Optional" />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="label">Bill Date</label>
            <input className="input" type="date" value={billDate} onChange={e => setBillDate(e.target.value)} />
          </div>
          <div>
            <label className="label">Payment Mode</label>
            <div className="flex gap-2 mt-1">
              {PAYMENT_MODES.map(mode => (
                <button key={mode} type="button" onClick={() => setPaymentMode(mode)}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                    paymentMode === mode ? 'bg-primary text-white border-primary' : 'bg-white text-gray-600 border-gray-300 hover:border-primary'
                  }`}>{mode}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="label">Discount %</label>
            <input className="input w-24" type="number" min={0} max={100} step={0.5}
              value={discountPercent} onChange={e => setDiscountPercent(Number(e.target.value))} />
          </div>
        </div>
      </div>

      {/* Add item search */}
      <div className="card">
        <h3 className="font-semibold text-gray-700 mb-2">Add Item</h3>
        <div className="relative">
          <input ref={searchRef} className="input" placeholder="Search medicine…"
            value={query} onChange={e => setQuery(e.target.value)} autoComplete="off" />
          {results.length > 0 && (
            <div className="absolute left-0 top-full mt-1 z-50 bg-white border border-gray-200 rounded-lg shadow-lg w-full max-h-56 overflow-y-auto">
              {results.map(m => (
                <button key={`${m.id}-${m.batch_id}`} type="button" onMouseDown={() => addItem(m)}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 border-b last:border-0">
                  <span className="font-medium">{m.name}</span>
                  <span className="text-gray-400 text-xs ml-2">{formatINR(Number(m.selling_price))} · Stock: {m.stock_qty}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Items table */}
      <div className="card p-0">
        <div className="px-4 py-2 border-b border-gray-100">
          <span className="font-semibold text-gray-700 text-sm">Items ({items.length})</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="table-header">Item</th>
                <th className="table-header text-center" style={{ width: 60 }}>Qty</th>
                <th className="table-header text-right" style={{ width: 90 }}>Unit Price</th>
                <th className="table-header text-right" style={{ width: 90 }}>Total</th>
                <th className="table-header text-center" style={{ width: 40 }}></th>
              </tr>
            </thead>
            <tbody>
              {items.map(it => (
                <tr key={it.key} className="border-b last:border-0">
                  <td className="table-cell">
                    <div className="font-medium">{it.medicine_name}</div>
                    {it.batch_no && <div className="text-xs text-gray-400">Batch: {it.batch_no}</div>}
                  </td>
                  <td className="table-cell text-center">
                    <input type="number" min={1} value={it.qty}
                      className="input w-16 text-center text-sm"
                      onChange={e => updateItem(it.key, { qty: Math.max(1, Number(e.target.value)) })} />
                  </td>
                  <td className="table-cell text-right">
                    <input type="number" min={0} step={0.01} value={it.unit_price}
                      className="input w-24 text-right text-sm"
                      onChange={e => updateItem(it.key, { unit_price: Number(e.target.value) })} />
                  </td>
                  <td className="table-cell text-right font-medium">{formatINR(it.line_total)}</td>
                  <td className="table-cell text-center">
                    <button onClick={() => removeItem(it.key)} className="text-danger hover:opacity-70 text-xs font-bold">✕</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="flex justify-end px-4 py-3 border-t">
          <div className="w-56 space-y-1 text-sm">
            {discountAmt > 0 && (
              <div className="flex justify-between text-success">
                <span>Discount ({discountPercent}%)</span><span>- {formatINR(discountAmt)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-primary text-base border-t pt-1">
              <span>Grand Total</span><span>{formatINR(grandTotal)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
