'use client';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useRouter } from 'next/navigation';
import { useMedicineStore } from '@/store/useMedicineStore';
import { formatINR } from '@/utils/currency';
import type { Supplier } from '@/types/supplier';

interface PurchaseRow {
  key: string;
  medicine_id: number | null;
  medicine_name: string;
  hsn: string;
  batch_no: string;
  expiry_month: string;
  expiry_year: string;
  packing: string;
  pack_qty: string;
  qty: string;
  deal_qty: string;
  rate: string;
  discount: string;
  gst_percent: string;
  mrp: string;
  manufacture_name: string;
}

function randomKey() { return Math.random().toString(36).slice(2, 9); }

function emptyRow(): PurchaseRow {
  return { key: randomKey(), medicine_id: null, medicine_name: '', hsn: '', batch_no: '',
    expiry_month: '', expiry_year: '', packing: '', pack_qty: '1', qty: '', deal_qty: '0',
    rate: '', discount: '0', gst_percent: '5', mrp: '', manufacture_name: '' };
}

function computeRow(row: PurchaseRow) {
  const qty = Number(row.qty) || 0;
  const rate = Number(row.rate) || 0;
  const disc = Number(row.discount) || 0;
  const gst = Number(row.gst_percent) || 0;
  const taxable = qty * rate * (1 - disc / 100);
  const half = gst / 2;
  const cgst = taxable * half / 100;
  const sgst = taxable * half / 100;
  return {
    taxable: parseFloat(taxable.toFixed(2)),
    cgstPct: half, sgstPct: half,
    cgst: parseFloat(cgst.toFixed(2)),
    sgst: parseFloat(sgst.toFixed(2)),
    amount: parseFloat(taxable.toFixed(2)),
    discountAmt: parseFloat((qty * rate * disc / 100).toFixed(2)),
  };
}

const GST_OPTIONS = ['0', '5', '12', '18', '28'];
const PAYMENT_MODES = ['Cash', 'UPI', 'Card'];

export default function EditPurchasePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { medicines, loadMedicines } = useMedicineStore();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [purchaseNumber, setPurchaseNumber] = useState('');

  // Header
  const [supplierName, setSupplierName] = useState('');
  const [supplierInvoiceNo, setSupplierInvoiceNo] = useState('');
  const [supplierGstin, setSupplierGstin] = useState('');
  const [supplierAddress, setSupplierAddress] = useState('');
  const [supplierPhone, setSupplierPhone] = useState('');
  const [supplierDrugLicense, setSupplierDrugLicense] = useState('');
  const [paymentMode, setPaymentMode] = useState('Cash');
  const [purchaseDate, setPurchaseDate] = useState('');
  const [notes, setNotes] = useState('');

  // Rows
  const [rows, setRows] = useState<PurchaseRow[]>([emptyRow()]);
  const [focusedRowKey, setFocusedRowKey] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [dropdownAnchor, setDropdownAnchor] = useState<{ top: number; left: number } | null>(null);
  const tableRef = useRef<HTMLDivElement>(null);

  // Supplier picker
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [supplierSearch, setSupplierSearch] = useState('');
  const [showSupplierDropdown, setShowSupplierDropdown] = useState(false);

  useEffect(() => {
    loadMedicines();
    setMounted(true);
    fetch('/api/suppliers').then(r => r.json()).then(setSuppliers).catch(() => {});
    fetch(`/api/purchases/${id}`)
      .then(r => r.json())
      .then(data => {
        setPurchaseNumber(data.purchase_number);
        setSupplierName(data.supplier_name || '');
        setSupplierInvoiceNo(data.supplier_invoice_no || '');
        setSupplierGstin(data.supplier_gstin || '');
        setSupplierAddress(data.supplier_address || '');
        setSupplierPhone(data.supplier_phone || '');
        setSupplierDrugLicense(data.supplier_drug_license || '');
        setPaymentMode(data.payment_mode || 'Cash');
        setNotes(data.notes || '');
        setPurchaseDate(data.created_at ? data.created_at.slice(0, 10) : new Date().toISOString().slice(0, 10));
        if (data.items?.length > 0) {
          setRows(data.items.map((item: any) => ({
            key: randomKey(),
            medicine_id: item.medicine_id ?? null,
            medicine_name: item.medicine_name || '',
            hsn: item.hsn || '',
            batch_no: item.batch_no || '',
            expiry_month: item.expiry_month != null ? String(item.expiry_month) : '',
            expiry_year: item.expiry_year != null ? String(item.expiry_year) : '',
            packing: item.packing || '',
            pack_qty: String(item.pack_qty ?? 1),
            qty: item.qty > 0 ? String(item.qty) : '',
            deal_qty: String(item.deal_qty ?? 0),
            rate: item.rate > 0 ? String(item.rate) : '',
            discount: String(item.discount ?? 0),
            gst_percent: item.cgst_percent != null ? String(Number(item.cgst_percent) * 2) : '5',
            mrp: item.mrp > 0 ? String(item.mrp) : '',
            manufacture_name: item.manufacture_name || '',
          })));
        }
      })
      .finally(() => setLoading(false));
  }, [id]);

  const filteredSuppliers = suppliers.filter(s =>
    s.name.toLowerCase().includes(supplierSearch.toLowerCase()) || s.phone.includes(supplierSearch)
  );

  const pickSupplier = (s: Supplier) => {
    setSupplierName(s.name); setSupplierGstin(s.gstin || '');
    setSupplierAddress(s.address || ''); setSupplierPhone(s.phone || '');
    setSupplierDrugLicense(s.drug_license || '');
    setSupplierSearch(''); setShowSupplierDropdown(false);
  };

  const updateRow = (key: string, patch: Partial<PurchaseRow>) =>
    setRows(prev => prev.map(r => r.key === key ? { ...r, ...patch } : r));

  const addRow = () => {
    setRows(prev => [...prev, emptyRow()]);
    setTimeout(() => { if (tableRef.current) tableRef.current.scrollTop = tableRef.current.scrollHeight; }, 50);
  };

  const deleteRow = (key: string) =>
    setRows(prev => prev.length > 1 ? prev.filter(r => r.key !== key) : prev);

  const activeFocusedRow = rows.find(r => r.key === focusedRowKey);
  const activeSuggestions = activeFocusedRow && activeFocusedRow.medicine_name.trim()
    ? medicines.filter(m => {
        const q = activeFocusedRow.medicine_name.toLowerCase();
        return m.name.toLowerCase().includes(q) || (m.generic_name && m.generic_name.toLowerCase().includes(q));
      }).slice(0, 6)
    : [];

  const selectMedicine = (rowKey: string, med: (typeof medicines)[0]) => {
    updateRow(rowKey, {
      medicine_id: med.id ?? null, medicine_name: med.name, hsn: med.hsn || '',
      batch_no: med.batch_no || '', expiry_month: med.expiry_month ? String(med.expiry_month) : '',
      expiry_year: med.expiry_year ? String(med.expiry_year) : '', packing: med.packing || '',
      pack_qty: med.packing_qty ? String(med.packing_qty) : '1',
      gst_percent: med.gst_percent ? String(med.gst_percent) : '5',
      mrp: med.mrp ? String(med.mrp) : '', manufacture_name: med.manufacture_name || '',
      rate: med.rate ? String(med.rate) : '',
    });
    setFocusedRowKey(null);
  };

  const totals = rows.reduce((acc, row) => {
    const c = computeRow(row);
    acc.subtotal += c.taxable; acc.cgst += c.cgst; acc.sgst += c.sgst;
    acc.grand += c.amount + c.cgst + c.sgst;
    acc.qty += Number(row.qty) || 0; acc.discount += c.discountAmt;
    return acc;
  }, { subtotal: 0, cgst: 0, sgst: 0, grand: 0, qty: 0, discount: 0 });

  const roundedTotals = {
    subtotal: parseFloat(totals.subtotal.toFixed(2)),
    cgst: parseFloat(totals.cgst.toFixed(2)),
    sgst: parseFloat(totals.sgst.toFixed(2)),
    grand: parseFloat(totals.grand.toFixed(2)),
    qty: totals.qty,
    discount: parseFloat(totals.discount.toFixed(2)),
  };

  const handleSave = async () => {
    const validRows = rows.filter(r => r.medicine_name.trim() && (Number(r.qty) || 0) > 0);
    if (validRows.length === 0) return alert('Add at least one item with name and qty.');
    setSaving(true);
    try {
      const items = validRows.map(row => {
        const c = computeRow(row);
        return {
          medicine_id: row.medicine_id, medicine_name: row.medicine_name, hsn: row.hsn,
          batch_no: row.batch_no, expiry_month: row.expiry_month ? Number(row.expiry_month) : null,
          expiry_year: row.expiry_year ? Number(row.expiry_year) : null, packing: row.packing,
          pack_qty: Number(row.pack_qty) || 1, qty: Number(row.qty) || 0,
          deal_qty: Number(row.deal_qty) || 0, rate: Number(row.rate) || 0,
          discount: Number(row.discount) || 0, cgst_percent: c.cgstPct, sgst_percent: c.sgstPct,
          cgst_amount: c.cgst, sgst_amount: c.sgst, taxable_amount: c.taxable, amount: c.amount,
          mrp: Number(row.mrp) || 0, manufacture_name: row.manufacture_name,
        };
      });
      const res = await fetch(`/api/purchases/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          purchase: {
            supplier_name: supplierName, supplier_invoice_no: supplierInvoiceNo,
            supplier_gstin: supplierGstin, supplier_address: supplierAddress,
            supplier_phone: supplierPhone, supplier_drug_license: supplierDrugLicense,
            payment_mode: paymentMode, notes,
            created_at: purchaseDate ? new Date(purchaseDate).toISOString() : new Date().toISOString(),
            subtotal: roundedTotals.subtotal, cgst_total: roundedTotals.cgst,
            sgst_total: roundedTotals.sgst, discount_total: roundedTotals.discount,
            grand_total: roundedTotals.grand,
          },
          items,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update');
      router.push(`/purchases/${id}`);
    } catch (e: any) {
      alert(e.message || 'Failed to save');
      setSaving(false);
    }
  };

  if (loading) return <div className="text-center py-12 text-gray-400">Loading…</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="text-primary text-sm hover:underline">← Back</button>
          <h2 className="text-xl font-bold text-gray-800">Edit Purchase {purchaseNumber}</h2>
        </div>
        <div className="flex gap-2">
          <button onClick={() => router.back()} className="btn-secondary text-sm">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="btn-primary text-sm">
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* Supplier card */}
      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-700">Supplier Details</h3>
          <div className="relative">
            <input className="input text-sm w-56" placeholder="Pick from Supplier Master…"
              value={supplierSearch}
              onFocus={() => setShowSupplierDropdown(true)}
              onBlur={() => setTimeout(() => setShowSupplierDropdown(false), 150)}
              onChange={e => { setSupplierSearch(e.target.value); setShowSupplierDropdown(true); }} />
            {showSupplierDropdown && filteredSuppliers.length > 0 && (
              <div className="absolute right-0 top-full mt-1 z-50 bg-white border border-gray-200 rounded-lg shadow-lg w-72 max-h-48 overflow-y-auto">
                {filteredSuppliers.map(s => (
                  <button key={s.id} type="button" onMouseDown={() => pickSupplier(s)}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 border-b last:border-0">
                    <p className="font-medium text-gray-800">{s.name}</p>
                    {s.phone && <p className="text-xs text-gray-400">{s.phone}</p>}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-3">
          <div>
            <label className="label">Supplier Name</label>
            <input className="input" value={supplierName} onChange={e => setSupplierName(e.target.value)} />
          </div>
          <div>
            <label className="label">Supplier Invoice No</label>
            <input className="input" value={supplierInvoiceNo} onChange={e => setSupplierInvoiceNo(e.target.value)} />
          </div>
          <div>
            <label className="label">Supplier GSTIN</label>
            <input className="input" value={supplierGstin} onChange={e => setSupplierGstin(e.target.value)} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Drug License No.</label>
            <input className="input" value={supplierDrugLicense} onChange={e => setSupplierDrugLicense(e.target.value)} />
          </div>
          <div>
            <label className="label">Contact No.</label>
            <input className="input" value={supplierPhone} onChange={e => setSupplierPhone(e.target.value)} />
          </div>
        </div>
        <div className="mt-3">
          <label className="label">Supplier Address</label>
          <input className="input" value={supplierAddress} onChange={e => setSupplierAddress(e.target.value)} />
        </div>
        <div className="mt-3">
          <label className="label">Notes</label>
          <textarea className="input" rows={2} value={notes} onChange={e => setNotes(e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-3 mt-3">
          <div>
            <label className="label">Purchase Date</label>
            <input className="input" type="date" value={purchaseDate} onChange={e => setPurchaseDate(e.target.value)} />
          </div>
          <div>
            <label className="label mb-1 block">Payment Mode</label>
            <div className="flex gap-2 mt-1">
              {PAYMENT_MODES.map(mode => (
                <button key={mode} type="button" onClick={() => setPaymentMode(mode)}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                    paymentMode === mode ? 'bg-primary text-white border-primary' : 'bg-white text-gray-600 border-gray-300 hover:border-primary'
                  }`}>{mode}</button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Items table */}
      <div className="card p-0">
        <div className="px-4 py-2 border-b border-gray-100 flex items-center justify-between">
          <span className="font-semibold text-gray-700 text-sm">Items</span>
          <button onClick={addRow} className="btn-primary text-xs py-1 px-3">+ Add Row</button>
        </div>
        <div className="overflow-x-auto" ref={tableRef}>
          <table className="text-xs" style={{ minWidth: 1080, width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr className="bg-primary text-white">
                <th style={{ width: 30, padding: '6px 4px', textAlign: 'center' }}>#</th>
                <th style={{ width: 160, padding: '6px 4px' }}>Item</th>
                <th style={{ width: 80, padding: '6px 4px' }}>Batch</th>
                <th style={{ width: 48, padding: '6px 4px', textAlign: 'center' }}>Exp MM</th>
                <th style={{ width: 56, padding: '6px 4px', textAlign: 'center' }}>Exp YYYY</th>
                <th style={{ width: 60, padding: '6px 4px' }}>Packing</th>
                <th style={{ width: 48, padding: '6px 4px', textAlign: 'center' }}>Pack Qty</th>
                <th style={{ width: 52, padding: '6px 4px', textAlign: 'center' }}>Qty</th>
                <th style={{ width: 48, padding: '6px 4px', textAlign: 'center' }}>Deal</th>
                <th style={{ width: 72, padding: '6px 4px', textAlign: 'right' }}>Rate</th>
                <th style={{ width: 52, padding: '6px 4px', textAlign: 'center' }}>Disc%</th>
                <th style={{ width: 68, padding: '6px 4px', textAlign: 'center' }}>GST%</th>
                <th style={{ width: 72, padding: '6px 4px', textAlign: 'right' }}>MRP</th>
                <th style={{ width: 82, padding: '6px 4px', textAlign: 'right' }}>Amount</th>
                <th style={{ width: 30, padding: '6px 4px' }}></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, idx) => {
                const computed = computeRow(row);
                const isFocused = focusedRowKey === row.key;
                return (
                  <tr key={row.key} style={{ borderBottom: '1px solid #f0f0f0' }}>
                    <td style={{ padding: '4px', textAlign: 'center', color: '#999' }}>{idx + 1}</td>
                    <td style={{ padding: '2px 4px', position: 'relative' }}>
                      <input className="input text-xs" style={{ width: '100%' }} value={row.medicine_name}
                        placeholder="Item name"
                        onChange={e => updateRow(row.key, { medicine_name: e.target.value, medicine_id: null })}
                        onFocus={e => {
                          setFocusedRowKey(row.key);
                          const rect = (e.target as HTMLElement).getBoundingClientRect();
                          setDropdownAnchor({ top: rect.bottom + window.scrollY, left: rect.left + window.scrollX });
                        }}
                        onBlur={() => setTimeout(() => { if (focusedRowKey === row.key) { setFocusedRowKey(null); setDropdownAnchor(null); } }, 150)} />
                      {isFocused && activeSuggestions.length > 0 && mounted && dropdownAnchor && createPortal(
                        <div style={{ position: 'absolute', top: dropdownAnchor.top, left: dropdownAnchor.left, zIndex: 9999, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, boxShadow: '0 4px 16px rgba(0,0,0,0.12)', minWidth: 280, maxHeight: 220, overflowY: 'auto' }}>
                          {activeSuggestions.map(m => (
                            <button key={`${m.id}-${m.batch_id}`} type="button" onMouseDown={() => selectMedicine(row.key, m)}
                              style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 12px', fontSize: 13, borderBottom: '1px solid #f3f4f6', cursor: 'pointer' }}
                              onMouseEnter={e => (e.currentTarget.style.background = '#eff6ff')}
                              onMouseLeave={e => (e.currentTarget.style.background = '#fff')}>
                              <span style={{ fontWeight: 600 }}>{m.name}</span>
                              {m.generic_name && <span style={{ color: '#9ca3af', marginLeft: 4 }}>({m.generic_name})</span>}
                              <span style={{ color: '#6b7280', marginLeft: 8 }}>{formatINR(Number(m.selling_price))} · Stock: {m.stock_qty}</span>
                            </button>
                          ))}
                        </div>, document.body
                      )}
                    </td>
                    <td style={{ padding: '2px 4px' }}><input className="input text-xs" style={{ width: '100%' }} value={row.batch_no} onChange={e => updateRow(row.key, { batch_no: e.target.value })} /></td>
                    <td style={{ padding: '2px 4px' }}><input className="input text-xs" style={{ width: '100%' }} type="number" min={1} max={12} placeholder="MM" value={row.expiry_month} onChange={e => updateRow(row.key, { expiry_month: e.target.value })} /></td>
                    <td style={{ padding: '2px 4px' }}><input className="input text-xs" style={{ width: '100%' }} type="number" min={2020} max={2050} placeholder="YYYY" value={row.expiry_year} onChange={e => updateRow(row.key, { expiry_year: e.target.value })} /></td>
                    <td style={{ padding: '2px 4px' }}><input className="input text-xs" style={{ width: '100%' }} value={row.packing} onChange={e => updateRow(row.key, { packing: e.target.value })} /></td>
                    <td style={{ padding: '2px 4px' }}><input className="input text-xs" style={{ width: '100%' }} type="number" min={1} value={row.pack_qty} onChange={e => updateRow(row.key, { pack_qty: e.target.value })} /></td>
                    <td style={{ padding: '2px 4px' }}><input className="input text-xs" style={{ width: '100%' }} type="number" min={0} value={row.qty} onChange={e => updateRow(row.key, { qty: e.target.value })} /></td>
                    <td style={{ padding: '2px 4px' }}><input className="input text-xs" style={{ width: '100%' }} type="number" min={0} value={row.deal_qty} onChange={e => updateRow(row.key, { deal_qty: e.target.value })} /></td>
                    <td style={{ padding: '2px 4px' }}><input className="input text-xs" style={{ width: '100%', textAlign: 'right' }} type="number" step="0.01" value={row.rate} onChange={e => updateRow(row.key, { rate: e.target.value })} /></td>
                    <td style={{ padding: '2px 4px' }}><input className="input text-xs" style={{ width: '100%' }} type="number" step="0.01" min={0} max={100} value={row.discount} onChange={e => updateRow(row.key, { discount: e.target.value })} /></td>
                    <td style={{ padding: '2px 4px' }}>
                      <select className="input text-xs" style={{ width: '100%' }} value={row.gst_percent} onChange={e => updateRow(row.key, { gst_percent: e.target.value })}>
                        {GST_OPTIONS.map(g => <option key={g} value={g}>{g}%</option>)}
                      </select>
                    </td>
                    <td style={{ padding: '2px 4px' }}><input className="input text-xs" style={{ width: '100%', textAlign: 'right' }} type="number" step="0.01" value={row.mrp} onChange={e => updateRow(row.key, { mrp: e.target.value })} /></td>
                    <td style={{ padding: '4px', textAlign: 'right', fontWeight: 500 }}>{computed.amount > 0 ? formatINR(computed.amount) : '—'}</td>
                    <td style={{ padding: '2px 4px', textAlign: 'center' }}>
                      <button onClick={() => deleteRow(row.key)} style={{ color: '#d32f2f', fontWeight: 700, fontSize: 14, lineHeight: 1, cursor: 'pointer', background: 'none', border: 'none', padding: '2px 4px' }}>✕</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer totals */}
        <div style={{ padding: '12px 16px', borderTop: '1px solid #f0f0f0', display: 'flex', justifyContent: 'flex-end', gap: 24, fontSize: 13 }}>
          <span className="text-gray-500">Subtotal: <strong>{formatINR(roundedTotals.subtotal)}</strong></span>
          <span className="text-gray-500">CGST: <strong>{formatINR(roundedTotals.cgst)}</strong></span>
          <span className="text-gray-500">SGST: <strong>{formatINR(roundedTotals.sgst)}</strong></span>
          <span className="text-gray-500">Discount: <strong>{formatINR(roundedTotals.discount)}</strong></span>
          <span className="text-primary font-bold text-base">Grand Total: {formatINR(roundedTotals.grand)}</span>
        </div>
      </div>
    </div>
  );
}
