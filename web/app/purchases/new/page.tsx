'use client';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { useMedicineStore } from '@/store/useMedicineStore';
import { formatINR } from '@/utils/currency';
import type { ExtractedPO } from '@/app/api/purchases/extract/route';
import type { Supplier } from '@/types/supplier';

// ── Types ──────────────────────────────────────────────────────────────────────

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

// ── Helpers ────────────────────────────────────────────────────────────────────

function randomKey() {
  return Math.random().toString(36).slice(2, 9);
}

function emptyRow(): PurchaseRow {
  return {
    key: randomKey(),
    medicine_id: null,
    medicine_name: '',
    hsn: '',
    batch_no: '',
    expiry_month: '',
    expiry_year: '',
    packing: '',
    pack_qty: '1',
    qty: '',
    deal_qty: '0',
    rate: '',
    discount: '0',
    gst_percent: '5',
    mrp: '',
    manufacture_name: '',
  };
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
  const amount = taxable;
  return {
    taxable: parseFloat(taxable.toFixed(2)),
    cgstPct: half,
    sgstPct: half,
    cgst: parseFloat(cgst.toFixed(2)),
    sgst: parseFloat(sgst.toFixed(2)),
    amount: parseFloat(amount.toFixed(2)),
    discountAmt: parseFloat((qty * rate * disc / 100).toFixed(2)),
  };
}

const GST_OPTIONS = ['0', '5', '12', '18', '28'];
const PAYMENT_MODES = ['Cash', 'UPI', 'Card'];

// ── Component ──────────────────────────────────────────────────────────────────

const DRAFT_KEY = 'po_draft';

function loadDraft() {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function saveDraft(data: object) {
  try { localStorage.setItem(DRAFT_KEY, JSON.stringify(data)); } catch {}
}

function clearDraft() {
  try { localStorage.removeItem(DRAFT_KEY); } catch {}
}

export default function NewPurchasePage() {
  const router = useRouter();
  const { medicines, loadMedicines } = useMedicineStore();

  // ── Restore draft on first render ────────────────────────────────────────────
  const draft = typeof window !== 'undefined' ? loadDraft() : null;

  // Header fields
  const [supplierName, setSupplierName] = useState(draft?.supplierName ?? '');
  const [supplierInvoiceNo, setSupplierInvoiceNo] = useState(draft?.supplierInvoiceNo ?? '');
  const [supplierGstin, setSupplierGstin] = useState(draft?.supplierGstin ?? '');
  const [supplierAddress, setSupplierAddress] = useState(draft?.supplierAddress ?? '');
  const [supplierPhone, setSupplierPhone] = useState(draft?.supplierPhone ?? '');
  const [supplierDrugLicense, setSupplierDrugLicense] = useState(draft?.supplierDrugLicense ?? '');
  const [paymentMode, setPaymentMode] = useState(draft?.paymentMode ?? 'Cash');
  const [purchaseDate, setPurchaseDate] = useState(draft?.purchaseDate ?? new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState(draft?.notes ?? '');
  const [roundOff, setRoundOff] = useState(draft?.roundOff ?? false);

  // Rows
  const [rows, setRows] = useState<PurchaseRow[]>(draft?.rows ?? [emptyRow()]);
  const [hasDraft] = useState(!!draft);
  const [focusedRowKey, setFocusedRowKey] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const tableRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [mounted, setMounted] = useState(false);
  const [dropdownAnchor, setDropdownAnchor] = useState<{ top: number; left: number } | null>(null);

  // ── AI Import state ──────────────────────────────────────────────────────────
  const [importOpen, setImportOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importPreview, setImportPreview] = useState<string | null>(null); // object URL for images
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractStatus, setExtractStatus] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  // ── Supplier master state ─────────────────────────────────────────────────
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [supplierSearch, setSupplierSearch] = useState('');
  const [showSupplierDropdown, setShowSupplierDropdown] = useState(false);

  useEffect(() => {
    loadMedicines();
    setMounted(true);
    fetch('/api/suppliers').then(r => r.json()).then(setSuppliers).catch(() => {});
  }, []);

  // ── Auto-save draft on every change ─────────────────────────────────────────
  useEffect(() => {
    saveDraft({ supplierName, supplierInvoiceNo, supplierGstin, supplierAddress,
      supplierPhone, supplierDrugLicense, paymentMode, purchaseDate, notes, roundOff, rows });
  }, [supplierName, supplierInvoiceNo, supplierGstin, supplierAddress,
      supplierPhone, supplierDrugLicense, paymentMode, purchaseDate, notes, rows]);

  const filteredSuppliers = suppliers.filter(s =>
    s.name.toLowerCase().includes(supplierSearch.toLowerCase()) ||
    s.phone.includes(supplierSearch)
  );

  const pickSupplier = (s: Supplier) => {
    setSupplierName(s.name);
    setSupplierGstin(s.gstin || '');
    setSupplierAddress(s.address || '');
    setSupplierPhone(s.phone || '');
    setSupplierDrugLicense(s.drug_license || '');
    setSupplierSearch('');
    setShowSupplierDropdown(false);
  };

  // ── Row helpers ──────────────────────────────────────────────────────────────

  const updateRow = (key: string, patch: Partial<PurchaseRow>) => {
    setRows(prev => prev.map(r => (r.key === key ? { ...r, ...patch } : r)));
  };

  const addRow = () => {
    setRows(prev => [...prev, emptyRow()]);
    setTimeout(() => {
      if (tableRef.current) {
        tableRef.current.scrollTop = tableRef.current.scrollHeight;
      }
    }, 50);
  };

  const deleteRow = (key: string) => {
    setRows(prev => (prev.length > 1 ? prev.filter(r => r.key !== key) : prev));
  };

  // ── Insert key → add row ─────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Insert') {
        e.preventDefault();
        addRow();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

// Suggestions for the currently focused row — computed outside the row map so the portal can use them
  const activeFocusedRow = rows.find(r => r.key === focusedRowKey);
  const activeSuggestions =
    activeFocusedRow && activeFocusedRow.medicine_name.trim()
      ? medicines
          .filter(m => {
            const q = activeFocusedRow.medicine_name.toLowerCase();
            return m.name.toLowerCase().includes(q) || (m.generic_name && m.generic_name.toLowerCase().includes(q));
          })
          .slice(0, 6)
      : [];

  const selectMedicine = (rowKey: string, med: (typeof medicines)[0]) => {
    updateRow(rowKey, {
      medicine_id: med.id ?? null,
      medicine_name: med.name,
      hsn: med.hsn || '',
      batch_no: med.batch_no || '',
      expiry_month: med.expiry_month ? String(med.expiry_month) : '',
      expiry_year: med.expiry_year ? String(med.expiry_year) : '',
      packing: med.packing || '',
      pack_qty: med.packing_qty ? String(med.packing_qty) : '1',
      gst_percent: med.gst_percent ? String(med.gst_percent) : '5',
      mrp: med.mrp ? String(med.mrp) : '',
      manufacture_name: med.manufacture_name || '',
      rate: med.rate ? String(med.rate) : '',
    });
    setFocusedRowKey(null);
  };

  // ── AI Import helpers ─────────────────────────────────────────────────────────

  const handleFileSelect = (file: File) => {
    setExtractStatus(null);
    setImportFile(file);
    if (file.type.startsWith('image/')) {
      setImportPreview(URL.createObjectURL(file));
    } else {
      setImportPreview(null);
    }
  };

  const handleExtract = async () => {
    if (!importFile) return;
    setIsExtracting(true);
    setExtractStatus(null);
    try {
      const fd = new FormData();
      fd.append('file', importFile);
      const res = await fetch('/api/purchases/extract', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Extraction failed');

      const po: ExtractedPO = data;

      // Pre-fill supplier fields
      if (po.supplier.supplier_name)     setSupplierName(po.supplier.supplier_name);
      if (po.supplier.supplier_invoice_no) setSupplierInvoiceNo(po.supplier.supplier_invoice_no);
      if (po.supplier.supplier_gstin)    setSupplierGstin(po.supplier.supplier_gstin);
      if (po.supplier.supplier_address)  setSupplierAddress(po.supplier.supplier_address);
      if (po.supplier.supplier_phone)    setSupplierPhone(po.supplier.supplier_phone);
      if (po.supplier.supplier_drug_license) setSupplierDrugLicense(po.supplier.supplier_drug_license);

      // Pre-fill item rows
      if (po.items.length > 0) {
        setRows(po.items.map(item => ({
          key:              randomKey(),
          medicine_id:      null,
          medicine_name:    item.medicine_name   || '',
          hsn:              item.hsn              || '',
          batch_no:         item.batch_no         || '',
          expiry_month:     item.expiry_month != null ? String(item.expiry_month) : '',
          expiry_year:      item.expiry_year  != null ? String(item.expiry_year)  : '',
          packing:          item.packing          || '',
          pack_qty:         String(item.pack_qty  ?? 1),
          qty:              item.qty  > 0  ? String(item.qty)  : '',
          deal_qty:         String(item.deal_qty  ?? 0),
          rate:             item.rate > 0  ? String(item.rate) : '',
          discount:         String(item.discount  ?? 0),
          gst_percent:      item.gst_percent      || '5',
          mrp:              item.mrp  > 0  ? String(item.mrp)  : '',
          manufacture_name: item.manufacture_name || '',
        })));
      }

      setExtractStatus({ type: 'success', msg: `Extracted ${po.items.length} item(s). Review and save.` });
    } catch (e: any) {
      setExtractStatus({ type: 'error', msg: e.message || 'Extraction failed' });
    } finally {
      setIsExtracting(false);
    }
  };

  // ── Grand totals ─────────────────────────────────────────────────────────────

  const totals = rows.reduce(
    (acc, row) => {
      const c = computeRow(row);
      acc.subtotal += c.taxable;
      acc.cgst += c.cgst;
      acc.sgst += c.sgst;
      acc.grand += c.amount + c.cgst + c.sgst;
      acc.qty += Number(row.qty) || 0;
      acc.discount += c.discountAmt;
      return acc;
    },
    { subtotal: 0, cgst: 0, sgst: 0, grand: 0, qty: 0, discount: 0 }
  );

  const rawGrand = parseFloat(totals.grand.toFixed(2));
  const roundOffAmt = roundOff ? parseFloat((Math.round(rawGrand) - rawGrand).toFixed(2)) : 0;
  const finalGrand = parseFloat((rawGrand + roundOffAmt).toFixed(2));

  const roundedTotals = {
    subtotal: parseFloat(totals.subtotal.toFixed(2)),
    cgst: parseFloat(totals.cgst.toFixed(2)),
    sgst: parseFloat(totals.sgst.toFixed(2)),
    grand: finalGrand,
    qty: totals.qty,
    discount: parseFloat(totals.discount.toFixed(2)),
  };

  // ── Submit ────────────────────────────────────────────────────────────────────

  const handleSave = async () => {
    const validRows = rows.filter(r => r.medicine_name.trim() && (Number(r.qty) || 0) > 0);
    if (validRows.length === 0) {
      alert('Please add at least one item with medicine name and quantity.');
      return;
    }

    setIsSubmitting(true);
    try {
      const items = validRows.map(row => {
        const c = computeRow(row);
        return {
          medicine_id: row.medicine_id,
          medicine_name: row.medicine_name,
          hsn: row.hsn,
          batch_no: row.batch_no,
          expiry_month: row.expiry_month ? Number(row.expiry_month) : null,
          expiry_year: row.expiry_year ? Number(row.expiry_year) : null,
          packing: row.packing,
          pack_qty: Number(row.pack_qty) || 1,
          qty: Number(row.qty) || 0,
          deal_qty: Number(row.deal_qty) || 0,
          rate: Number(row.rate) || 0,
          discount: Number(row.discount) || 0,
          cgst_percent: c.cgstPct,
          sgst_percent: c.sgstPct,
          cgst_amount: c.cgst,
          sgst_amount: c.sgst,
          taxable_amount: c.taxable,
          amount: c.amount,
          mrp: Number(row.mrp) || 0,
          manufacture_name: row.manufacture_name,
        };
      });

      const discountTotal = roundedTotals.discount;

      const res = await fetch('/api/purchases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          purchase: {
            supplier_name: supplierName,
            supplier_invoice_no: supplierInvoiceNo,
            supplier_gstin: supplierGstin,
            supplier_address: supplierAddress,
            supplier_phone: supplierPhone,
            supplier_drug_license: supplierDrugLicense,
            payment_mode: paymentMode,
            notes,
            purchase_date: purchaseDate,
            subtotal: roundedTotals.subtotal,
            cgst_total: roundedTotals.cgst,
            sgst_total: roundedTotals.sgst,
            discount_total: discountTotal,
            grand_total: roundedTotals.grand,
          },
          items,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save purchase');
      clearDraft();
      router.push(`/purchases/${data.id}`);
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Failed to save purchase');
      setIsSubmitting(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="text-primary text-sm hover:underline">
            ← Back
          </button>
          <h2 className="text-xl font-bold text-gray-800">New Purchase / GRN</h2>
        </div>
        <button
          onClick={() => {
            setSupplierName('');
            setSupplierInvoiceNo('');
            setSupplierGstin('');
            setSupplierAddress('');
            setSupplierPhone('');
            setSupplierDrugLicense('');
            setPaymentMode('Cash');
            setPurchaseDate(new Date().toISOString().slice(0, 10));
            setNotes('');
            setRows([emptyRow()]);
            setImportFile(null);
            setImportPreview(null);
            setExtractStatus(null);
            clearDraft();
          }}
          className="btn-secondary text-sm"
        >
          Clear
        </button>
      </div>

      {/* ── Draft restored banner ────────────────────────────────────────── */}
      {hasDraft && (
        <div className="flex items-center gap-2 bg-yellow-50 border border-yellow-200 text-yellow-800 text-sm px-4 py-2 rounded-lg">
          <span>⚡</span>
          <span>Draft restored from your last session. Review and save, or click <strong>Clear</strong> to start fresh.</span>
        </div>
      )}

      {/* ── AI Import card ─────────────────────────────────────────────────── */}
      <div
        className={`card border-2 border-dashed transition-colors ${
          importFile ? 'border-primary/40 bg-blue-50/30' : 'border-gray-200'
        }`}
        onDragOver={e => { e.preventDefault(); }}
        onDrop={e => {
          e.preventDefault();
          const file = e.dataTransfer.files[0];
          if (file) { handleFileSelect(file); setImportOpen(true); }
        }}
      >
        {/* Collapsible header */}
        <button
          type="button"
          className="w-full flex items-center justify-between text-left"
          onClick={() => setImportOpen(o => !o)}
        >
          <div>
            <p className="font-semibold text-gray-700 text-sm">
              <span className="mr-2 text-gray-400 text-xs">{importOpen ? '▼' : '▶'}</span>
              Import from Image / PDF
              {importFile && <span className="ml-2 text-xs text-primary font-normal">{importFile.name}</span>}
            </p>
            {!importOpen && (
              <p className="text-xs text-gray-400 mt-0.5 ml-4">Upload a supplier invoice — AI will pre-fill the form</p>
            )}
          </div>
          {importFile && (
            <button
              type="button"
              onClick={e => { e.stopPropagation(); setImportFile(null); setImportPreview(null); setExtractStatus(null); }}
              className="text-xs text-gray-400 hover:text-danger ml-4 shrink-0"
            >
              ✕ Clear
            </button>
          )}
        </button>

        {importOpen && <div className="mt-3">

        {!importFile ? (
          /* Drop zone */
          <div
            className="flex flex-col items-center justify-center py-6 cursor-pointer rounded-lg bg-gray-50 hover:bg-blue-50 transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            <span className="text-3xl mb-2">📄</span>
            <p className="text-sm text-gray-500">Click to browse or drag & drop</p>
            <p className="text-xs text-gray-400 mt-1">JPEG · PNG · WebP · PDF — max 10 MB</p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp,application/pdf"
              className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) handleFileSelect(f); e.target.value = ''; }}
            />
          </div>
        ) : (
          /* Preview + extract */
          <div className="flex items-start gap-4">
            {/* Image thumbnail or PDF icon */}
            {importPreview ? (
              <img
                src={importPreview}
                alt="Preview"
                className="w-28 h-28 object-cover rounded border border-gray-200 shrink-0"
              />
            ) : (
              <div className="w-28 h-28 flex flex-col items-center justify-center rounded border border-gray-200 bg-gray-50 shrink-0">
                <span className="text-3xl">📋</span>
                <p className="text-xs text-gray-500 mt-1 text-center px-1 truncate w-full text-center">
                  {importFile.name}
                </p>
              </div>
            )}

            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-700 truncate">{importFile.name}</p>
              <p className="text-xs text-gray-400 mb-3">
                {(importFile.size / 1024).toFixed(0)} KB · {importFile.type.split('/')[1].toUpperCase()}
              </p>

              <button
                type="button"
                onClick={handleExtract}
                disabled={isExtracting}
                className="btn-primary text-sm flex items-center gap-2"
              >
                {isExtracting ? (
                  <>
                    <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Extracting…
                  </>
                ) : (
                  '✦ Extract Data'
                )}
              </button>

              {extractStatus && (
                <p className={`text-xs mt-2 font-medium ${
                  extractStatus.type === 'success' ? 'text-success' : 'text-danger'
                }`}>
                  {extractStatus.type === 'success' ? '✓ ' : '✗ '}
                  {extractStatus.msg}
                </p>
              )}
            </div>
          </div>
        )}
        </div>}
      </div>

      {/* Supplier card */}
      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-700">Supplier Details</h3>
          <div className="relative">
            <input
              className="input text-sm w-56"
              placeholder="Pick from Supplier Master…"
              value={supplierSearch}
              onFocus={() => setShowSupplierDropdown(true)}
              onBlur={() => setTimeout(() => setShowSupplierDropdown(false), 150)}
              onChange={e => { setSupplierSearch(e.target.value); setShowSupplierDropdown(true); }}
            />
            {showSupplierDropdown && filteredSuppliers.length > 0 && (
              <div className="absolute right-0 top-full mt-1 z-50 bg-white border border-gray-200 rounded-lg shadow-lg w-72 max-h-48 overflow-y-auto">
                {filteredSuppliers.map(s => (
                  <button
                    key={s.id}
                    type="button"
                    onMouseDown={() => pickSupplier(s)}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 border-b last:border-0"
                  >
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
            <input
              className="input"
              placeholder="Supplier / Distributor"
              value={supplierName}
              onChange={e => setSupplierName(e.target.value)}
            />
          </div>
          <div>
            <label className="label">Supplier Invoice No</label>
            <input
              className="input"
              placeholder="INV-001"
              value={supplierInvoiceNo}
              onChange={e => setSupplierInvoiceNo(e.target.value)}
            />
          </div>
          <div>
            <label className="label">Supplier GSTIN</label>
            <input
              className="input"
              placeholder="Optional"
              value={supplierGstin}
              onChange={e => setSupplierGstin(e.target.value)}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 mt-3">
          <div>
            <label className="label">Drug License No.</label>
            <input
              className="input"
              placeholder="e.g. DL-UP-12345"
              value={supplierDrugLicense}
              onChange={e => setSupplierDrugLicense(e.target.value)}
            />
          </div>
          <div>
            <label className="label">Contact No.</label>
            <input
              className="input"
              placeholder="Supplier phone"
              value={supplierPhone}
              onChange={e => setSupplierPhone(e.target.value)}
            />
          </div>
        </div>
        <div className="mt-3">
          <label className="label">Supplier Address</label>
          <input
            className="input"
            placeholder="Optional"
            value={supplierAddress}
            onChange={e => setSupplierAddress(e.target.value)}
          />
        </div>
        <div className="mt-3">
          <label className="label">Notes</label>
          <textarea
            className="input"
            rows={2}
            placeholder="Optional remarks, e.g. partial delivery, credit terms…"
            value={notes}
            onChange={e => setNotes(e.target.value)}
          />
        </div>
        <div className="grid grid-cols-2 gap-3 mt-3">
          <div>
            <label className="label">Purchase Date</label>
            <input
              className="input"
              type="date"
              value={purchaseDate}
              onChange={e => setPurchaseDate(e.target.value)}
            />
          </div>
          <div>
            <label className="label mb-1 block">Payment Mode</label>
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

      {/* Items table */}
      <div className="card p-0">
        <div className="px-4 py-2 border-b border-gray-100 flex items-center justify-between">
          <span className="font-semibold text-gray-700 text-sm">Items</span>
          <button onClick={addRow} className="btn-primary text-xs py-1 px-3">+ Add Row <kbd className="ml-1 opacity-60 font-mono">Ins</kbd></button>
        </div>
        <div className="overflow-x-auto" ref={tableRef}>
          <table className="text-xs" style={{ minWidth: 1080, width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr className="bg-primary text-white">
                <th style={{ width: 30, padding: '6px 4px', textAlign: 'center', fontWeight: 600 }}>#</th>
                <th style={{ width: 140, padding: '6px 4px', fontWeight: 600 }}>Item</th>
                <th style={{ width: 70, padding: '6px 4px', fontWeight: 600 }}>HSN</th>
                <th style={{ width: 80, padding: '6px 4px', fontWeight: 600 }}>Batch</th>
                <th style={{ width: 100, padding: '6px 4px', textAlign: 'center', fontWeight: 600 }}>Exp (MM/YYYY)</th>
                <th style={{ width: 55, padding: '6px 4px', textAlign: 'center', fontWeight: 600 }}>Pack</th>
                <th style={{ width: 50, padding: '6px 4px', textAlign: 'center', fontWeight: 600 }}>Qty</th>
                <th style={{ width: 50, padding: '6px 4px', textAlign: 'center', fontWeight: 600 }}>Deal</th>
                <th style={{ width: 72, padding: '6px 4px', textAlign: 'right', fontWeight: 600 }}>Rate</th>
                <th style={{ width: 58, padding: '6px 4px', textAlign: 'center', fontWeight: 600 }}>Disc%</th>
                <th style={{ width: 68, padding: '6px 4px', textAlign: 'center', fontWeight: 600 }}>GST%</th>
                <th style={{ width: 72, padding: '6px 4px', textAlign: 'right', fontWeight: 600 }}>MRP</th>
                <th style={{ width: 105, padding: '6px 4px', fontWeight: 600 }}>Mfg</th>
                <th style={{ width: 82, padding: '6px 4px', textAlign: 'right', fontWeight: 600 }}>Amount</th>
                <th style={{ width: 28, padding: '6px 4px' }}></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, idx) => {
                const computed = computeRow(row);

                return (
                  <tr
                    key={row.key}
                    className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                    style={{ verticalAlign: 'top' }}
                  >
                    {/* # */}
                    <td style={{ padding: '4px 2px', textAlign: 'center', color: '#6B7280', paddingTop: 8 }}>
                      {idx + 1}
                    </td>

                    {/* Medicine name — dropdown rendered as portal to escape overflow-x-auto clipping */}
                    <td style={{ padding: '4px 2px' }}>
                      <input
                        type="text"
                        className="input text-xs"
                        style={{
                          width: 130,
                          padding: '3px 5px',
                          borderColor: row.medicine_id ? '#388E3C' : undefined,
                          outline: row.medicine_id ? '1px solid #388E3C' : undefined,
                        }}
                        placeholder="Type to search…"
                        value={row.medicine_name}
                        onChange={e => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          setDropdownAnchor({ top: rect.bottom + 4, left: rect.left });
                          updateRow(row.key, { medicine_name: e.target.value, medicine_id: null });
                        }}
                        onFocus={e => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          setDropdownAnchor({ top: rect.bottom + 4, left: rect.left });
                          setFocusedRowKey(row.key);
                        }}
                        onBlur={() => setTimeout(() => { setFocusedRowKey(null); setDropdownAnchor(null); }, 150)}
                      />
                      {row.medicine_id && (
                        <div style={{ fontSize: 9, color: '#388E3C', marginTop: 1, lineHeight: 1 }}>✓ linked</div>
                      )}
                    </td>

                    {/* HSN */}
                    <td style={{ padding: '4px 2px' }}>
                      <input
                        type="text"
                        className="input text-xs"
                        style={{ width: 64, padding: '3px 5px' }}
                        placeholder="HSN"
                        value={row.hsn}
                        onChange={e => updateRow(row.key, { hsn: e.target.value })}
                      />
                    </td>

                    {/* Batch */}
                    <td style={{ padding: '4px 2px' }}>
                      <input
                        type="text"
                        className="input text-xs"
                        style={{ width: 74, padding: '3px 5px' }}
                        placeholder="Batch"
                        value={row.batch_no}
                        onChange={e => updateRow(row.key, { batch_no: e.target.value })}
                      />
                    </td>

                    {/* Expiry MM / YYYY */}
                    <td style={{ padding: '4px 2px' }}>
                      <div style={{ display: 'flex', gap: 2 }}>
                        <input
                          type="text"
                          className="input text-xs"
                          style={{ width: 42, padding: '3px 4px', textAlign: 'center' }}
                          placeholder="MM"
                          maxLength={2}
                          value={row.expiry_month}
                          onChange={e => updateRow(row.key, { expiry_month: e.target.value })}
                        />
                        <input
                          type="text"
                          className="input text-xs"
                          style={{ width: 52, padding: '3px 4px', textAlign: 'center' }}
                          placeholder="YYYY"
                          maxLength={4}
                          value={row.expiry_year}
                          onChange={e => updateRow(row.key, { expiry_year: e.target.value })}
                        />
                      </div>
                    </td>

                    {/* Pack */}
                    <td style={{ padding: '4px 2px' }}>
                      <input
                        type="text"
                        className="input text-xs"
                        style={{ width: 50, padding: '3px 4px', textAlign: 'center' }}
                        placeholder="e.g. 10"
                        value={row.packing}
                        onChange={e => updateRow(row.key, { packing: e.target.value })}
                      />
                    </td>

                    {/* Qty */}
                    <td style={{ padding: '4px 2px' }}>
                      <input
                        type="number"
                        min={0}
                        className="input text-xs"
                        style={{ width: 48, padding: '3px 4px', textAlign: 'center' }}
                        placeholder="0"
                        value={row.qty}
                        onChange={e => updateRow(row.key, { qty: e.target.value })}
                      />
                    </td>

                    {/* Deal */}
                    <td style={{ padding: '4px 2px' }}>
                      <input
                        type="number"
                        min={0}
                        className="input text-xs"
                        style={{ width: 48, padding: '3px 4px', textAlign: 'center' }}
                        placeholder="0"
                        value={row.deal_qty}
                        onChange={e => updateRow(row.key, { deal_qty: e.target.value })}
                      />
                    </td>

                    {/* Rate */}
                    <td style={{ padding: '4px 2px' }}>
                      <input
                        type="number"
                        min={0}
                        step="0.01"
                        className="input text-xs"
                        style={{ width: 68, padding: '3px 5px', textAlign: 'right' }}
                        placeholder="0.00"
                        value={row.rate}
                        onChange={e => updateRow(row.key, { rate: e.target.value })}
                      />
                    </td>

                    {/* Disc% */}
                    <td style={{ padding: '4px 2px' }}>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        step="0.01"
                        className="input text-xs"
                        style={{ width: 54, padding: '3px 4px', textAlign: 'center' }}
                        placeholder="0"
                        value={row.discount}
                        onChange={e => updateRow(row.key, { discount: e.target.value })}
                      />
                    </td>

                    {/* GST% */}
                    <td style={{ padding: '4px 2px' }}>
                      <select
                        className="input text-xs"
                        style={{ width: 64, padding: '3px 4px' }}
                        value={row.gst_percent}
                        onChange={e => updateRow(row.key, { gst_percent: e.target.value })}
                      >
                        {GST_OPTIONS.map(g => (
                          <option key={g} value={g}>{g}%</option>
                        ))}
                      </select>
                    </td>

                    {/* MRP */}
                    <td style={{ padding: '4px 2px' }}>
                      <input
                        type="number"
                        min={0}
                        step="0.01"
                        className="input text-xs"
                        style={{ width: 68, padding: '3px 5px', textAlign: 'right' }}
                        placeholder="0.00"
                        value={row.mrp}
                        onChange={e => updateRow(row.key, { mrp: e.target.value })}
                      />
                    </td>

                    {/* Mfg */}
                    <td style={{ padding: '4px 2px' }}>
                      <input
                        type="text"
                        className="input text-xs"
                        style={{ width: 100, padding: '3px 5px' }}
                        placeholder="Manufacturer"
                        value={row.manufacture_name}
                        onChange={e => updateRow(row.key, { manufacture_name: e.target.value })}
                      />
                    </td>

                    {/* Amount (computed, read-only) */}
                    <td style={{ padding: '4px 6px', textAlign: 'right', paddingTop: 8, fontWeight: 600, color: '#1565C0', minWidth: 82 }}>
                      {computed.amount > 0 ? formatINR(computed.amount) : '—'}
                    </td>

                    {/* Delete */}
                    <td style={{ padding: '4px 2px', textAlign: 'center', paddingTop: 6 }}>
                      <button
                        type="button"
                        onClick={() => deleteRow(row.key)}
                        title="Remove row"
                        style={{ color: '#D32F2F', fontSize: 14, lineHeight: 1, padding: '2px 4px', cursor: 'pointer', background: 'none', border: 'none' }}
                        className="hover:opacity-70"
                      >
                        ×
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Medicine autocomplete portal — renders to document.body to escape overflow-x-auto clipping */}
      {mounted && activeSuggestions.length > 0 && dropdownAnchor && focusedRowKey && createPortal(
        <div
          style={{
            position: 'fixed',
            top: dropdownAnchor.top,
            left: dropdownAnchor.left,
            zIndex: 9999,
            background: '#fff',
            border: '1px solid #d1d5db',
            borderRadius: 6,
            boxShadow: '0 4px 16px rgba(0,0,0,0.14)',
            width: 260,
            maxHeight: 240,
            overflowY: 'auto',
          }}
        >
          <div style={{ padding: '4px 10px', fontSize: 9, color: '#9ca3af', borderBottom: '1px solid #f3f4f6', textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Select from inventory
          </div>
          {activeSuggestions.map(med => (
            <div
              key={med.id}
              onMouseDown={e => { e.preventDefault(); selectMedicine(focusedRowKey, med); }}
              style={{ padding: '7px 10px', cursor: 'pointer', borderBottom: '1px solid #f3f4f6' }}
              className="hover:bg-blue-50"
            >
              <div style={{ fontWeight: 600, fontSize: 12 }}>{med.name}</div>
              {med.generic_name && <div style={{ fontSize: 10, color: '#6b7280' }}>{med.generic_name}</div>}
              <div style={{ fontSize: 10, color: '#9ca3af' }}>
                {med.manufacture_name && <span>{med.manufacture_name} · </span>}
                {med.batch_no && <span>Batch: {med.batch_no} · </span>}
                Stock: {med.stock_qty} · MRP: ₹{Number(med.mrp).toFixed(2)}
              </div>
            </div>
          ))}
        </div>,
        document.body
      )}

      {/* Totals + Save */}
      <div className="flex justify-end">
        <div className="card w-80 space-y-2 text-sm">
          <div className="flex justify-between text-gray-600">
            <span>Total Items</span>
            <span>{rows.filter(r => r.medicine_name.trim()).length}</span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>Total Qty</span>
            <span>{roundedTotals.qty}</span>
          </div>
          <div className="flex justify-between text-gray-600 border-t pt-2">
            <span>Subtotal (Taxable)</span>
            <span>{formatINR(roundedTotals.subtotal)}</span>
          </div>
          {roundedTotals.discount > 0 && (
            <div className="flex justify-between text-success">
              <span>Discount (trade)</span>
              <span>- {formatINR(roundedTotals.discount)}</span>
            </div>
          )}
          <div className="flex justify-between text-gray-600">
            <span>CGST Total</span>
            <span>{formatINR(roundedTotals.cgst)}</span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>SGST Total</span>
            <span>{formatINR(roundedTotals.sgst)}</span>
          </div>
          <div className="flex items-center justify-between border-t pt-2">
            <label className="flex items-center gap-2 text-gray-600 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={roundOff}
                onChange={e => setRoundOff(e.target.checked)}
                className="w-4 h-4 accent-primary"
              />
              Round Off
            </label>
            {roundOff && (
              <span className={roundOffAmt >= 0 ? 'text-success text-sm' : 'text-danger text-sm'}>
                {roundOffAmt >= 0 ? '+' : ''}{formatINR(Math.abs(roundOffAmt))}
              </span>
            )}
          </div>
          <div className="flex justify-between text-base font-bold text-primary border-t pt-2">
            <span>Grand Total</span>
            <span>{formatINR(roundedTotals.grand)}</span>
          </div>
          <button
            onClick={handleSave}
            disabled={isSubmitting}
            className="btn-primary w-full mt-2"
          >
            {isSubmitting ? 'Saving…' : 'Save Purchase'}
          </button>
        </div>
      </div>
    </div>
  );
}
