'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useMedicineStore } from '@/store/useMedicineStore';
import { formatINR } from '@/utils/currency';
import { formatExpiry, isExpired, isExpiringSoon } from '@/utils/date';
import { LOW_STOCK_THRESHOLD, MEDICINE_CATEGORIES } from '@/constants/paymentModes';
import Pagination from '@/components/Pagination';
import SortableHeader, { SortDir } from '@/components/SortableHeader';

export default function MedicinesPage() {
  const { medicines, isLoading, loadMedicines, deleteMedicine, deleteBatch } = useMedicineStore();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [sortField, setSortField] = useState('name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Import state
  const fileRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ imported: number; errors: string[] } | null>(null);
  const [showImport, setShowImport] = useState(false);

  useEffect(() => { loadMedicines(); }, []);

  const handleSort = (field: string) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
    setPage(1);
  };

  const filtered = medicines.filter(m => {
    const q = query.trim().toLowerCase();
    if (q && !m.name.toLowerCase().includes(q) && !m.generic_name.toLowerCase().includes(q)) return false;
    if (category && (m.group || '') !== category) return false;
    if (lowStockOnly && m.stock_qty > LOW_STOCK_THRESHOLD) return false;
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    let av: any, bv: any;
    switch (sortField) {
      case 'name':          av = a.name.toLowerCase();      bv = b.name.toLowerCase(); break;
      case 'stock_qty':     av = a.stock_qty;               bv = b.stock_qty; break;
      case 'mrp':           av = Number(a.mrp);             bv = Number(b.mrp); break;
      case 'selling_price': av = Number(a.selling_price);   bv = Number(b.selling_price); break;
      case 'expiry':        av = (a.expiry_year ?? 9999) * 100 + (a.expiry_month ?? 99);
                            bv = (b.expiry_year ?? 9999) * 100 + (b.expiry_month ?? 99); break;
      default: return 0;
    }
    if (av < bv) return sortDir === 'asc' ? -1 : 1;
    if (av > bv) return sortDir === 'asc' ? 1 : -1;
    return 0;
  });

  const paged = pageSize === 0 ? sorted : sorted.slice((page - 1) * pageSize, page * pageSize);

  const resetFilters = () => { setQuery(''); setCategory(''); setLowStockOnly(false); setPage(1); };

  const handleDelete = async (m: (typeof medicines)[0]) => {
    if (m.batch_id) {
      if (!confirm(`Delete batch "${m.batch_no || '(no batch)'}" of "${m.name}"?`)) return;
      await deleteBatch(m.batch_id);
    } else {
      if (!confirm(`Delete "${m.name}" and all its batches?`)) return;
      await deleteMedicine(m.id!);
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    setImportResult(null);
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await fetch('/api/medicines/import', { method: 'POST', body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setImportResult(data);
      await loadMedicines();
    } catch (e: any) {
      setImportResult({ imported: 0, errors: [e.message ?? 'Import failed'] });
    } finally {
      setImporting(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const hasFilters = query || category || lowStockOnly;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-800">Item Master</h2>
        <div className="flex gap-2">
          <button onClick={() => { setShowImport(v => !v); setImportResult(null); }} className="btn-secondary text-sm">⬆ Import</button>
          <Link href="/medicines/add" className="btn-primary text-sm">+ Add Item</Link>
        </div>
      </div>

      {/* Import panel */}
      {showImport && (
        <div className="card border border-blue-100 bg-blue-50">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-700">Import Items from Excel / CSV</h3>
            <a href="/api/medicines/import/template" download className="text-primary text-sm hover:underline">⬇ Download Template</a>
          </div>
          <p className="text-xs text-gray-500 mb-3">
            Required column: <strong>name</strong>. Optional: generic_name, manufacture_name, category, hsn, packing, packing_qty, gst_percent, batch_no, expiry_month, expiry_year, mrp, selling_price, rate, discount, stock_qty.
          </p>
          <label className={`btn-primary text-sm cursor-pointer ${importing ? 'opacity-50 pointer-events-none' : ''}`}>
            {importing ? 'Importing…' : 'Choose File (.xlsx / .csv)'}
            <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleImport} disabled={importing} />
          </label>
          {importResult && (
            <div className="mt-3">
              {importResult.imported > 0 && <p className="text-success text-sm font-medium">✓ {importResult.imported} item{importResult.imported !== 1 ? 's' : ''} imported successfully.</p>}
              {importResult.errors.length > 0 && (
                <div className="mt-1">
                  <p className="text-danger text-sm font-medium">{importResult.errors.length} row(s) failed:</p>
                  <ul className="mt-1 text-xs text-danger space-y-0.5 max-h-32 overflow-y-auto">
                    {importResult.errors.map((e, i) => <li key={i}>• {e}</li>)}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <div className="card">
        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-4">
          <input
            className="input flex-1 min-w-48"
            placeholder="Search by name or generic name…"
            value={query}
            onChange={e => { setQuery(e.target.value); setPage(1); }}
          />
          <select className="input w-44" value={category} onChange={e => { setCategory(e.target.value); setPage(1); }}>
            <option value="">All Categories</option>
            {MEDICINE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
            <input type="checkbox" checked={lowStockOnly} onChange={e => { setLowStockOnly(e.target.checked); setPage(1); }} className="accent-primary" />
            Low stock only
          </label>
          {hasFilters && (
            <button onClick={resetFilters} className="text-xs text-gray-400 hover:text-danger underline">Clear filters</button>
          )}
        </div>

        {isLoading ? (
          <div className="text-center py-8 text-gray-400">Loading…</div>
        ) : sorted.length === 0 ? (
          <div className="text-center py-8 text-gray-400">No items found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <SortableHeader label="Name"          field="name"          current={sortField} dir={sortDir} onSort={handleSort} className="rounded-tl" />
                  <th className="table-header">Category</th>
                  <th className="table-header">Batch</th>
                  <SortableHeader label="Expiry"        field="expiry"        current={sortField} dir={sortDir} onSort={handleSort} />
                  <SortableHeader label="MRP"           field="mrp"           current={sortField} dir={sortDir} onSort={handleSort} />
                  <SortableHeader label="Selling"       field="selling_price" current={sortField} dir={sortDir} onSort={handleSort} />
                  <th className="table-header">GST</th>
                  <SortableHeader label="Stock"        field="stock_qty"     current={sortField} dir={sortDir} onSort={handleSort} />
                  <th className="table-header rounded-tr"></th>
                </tr>
              </thead>
              <tbody>
                {paged.map((m, idx) => {
                  const expired  = isExpired(m.expiry_month, m.expiry_year);
                  const expiring = isExpiringSoon(m.expiry_month, m.expiry_year);
                  const lowStock = m.stock_qty <= LOW_STOCK_THRESHOLD;
                  const editHref = `/medicines/${m.id}${m.batch_id ? `?batchId=${m.batch_id}` : ''}`;
                  return (
                    <tr key={`${m.id}-${m.batch_id ?? idx}`} className="hover:bg-gray-50">
                      <td className="table-cell">
                        <div className="font-medium">{m.name}</div>
                        {m.generic_name && <div className="text-gray-400 text-xs">{m.generic_name}</div>}
                        {m.packing && <div className="text-gray-400 text-xs">{m.packing}</div>}
                      </td>
                      <td className="table-cell">
                        {m.group ? <span className="badge bg-blue-100 text-primary text-xs">{m.group}</span> : <span className="text-gray-300">—</span>}
                      </td>
                      <td className="table-cell text-gray-500">{m.batch_no || '—'}</td>
                      <td className="table-cell">
                        {m.expiry_month ? (
                          <span className={expired ? 'text-danger font-medium' : expiring ? 'text-warning font-medium' : ''}>
                            {formatExpiry(m.expiry_month, m.expiry_year)}{expired ? ' ⚠' : expiring ? ' ⚡' : ''}
                          </span>
                        ) : '—'}
                      </td>
                      <td className="table-cell">{formatINR(Number(m.mrp))}</td>
                      <td className="table-cell">{formatINR(Number(m.selling_price))}</td>
                      <td className="table-cell">{m.gst_percent}%</td>
                      <td className="table-cell">
                        <span className={`badge ${lowStock ? 'bg-orange-100 text-warning' : 'bg-green-100 text-success'}`}>{m.stock_qty}</span>
                      </td>
                      <td className="table-cell">
                        <div className="flex gap-2">
                          <Link href={editHref} className="text-primary text-xs hover:underline">Edit</Link>
                          <button onClick={() => handleDelete(m)} className="text-danger text-xs hover:underline">Delete</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <Pagination total={sorted.length} page={page} pageSize={pageSize} onPageChange={setPage} onPageSizeChange={size => { setPageSize(size); setPage(1); }} />
      </div>
    </div>
  );
}
