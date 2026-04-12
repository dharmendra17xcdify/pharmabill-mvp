'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { SupplierReturn } from '@/types/supplierReturn';
import { formatINR } from '@/utils/currency';
import { formatDateShort } from '@/utils/date';
import Pagination from '@/components/Pagination';
import SortableHeader, { SortDir } from '@/components/SortableHeader';

export default function ReturnsPage() {
  const router = useRouter();
  const [returns, setReturns] = useState<SupplierReturn[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sortField, setSortField] = useState('created_at');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  useEffect(() => {
    setLoading(true);
    fetch('/api/supplier-returns')
      .then(r => r.json())
      .then(data => setReturns(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false));
  }, []);

  const handleSort = (field: string) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir(field === 'created_at' ? 'desc' : 'asc'); }
    setPage(1);
  };

  const filtered = returns.filter(r => {
    const q = query.trim().toLowerCase();
    if (q && !r.return_number.toLowerCase().includes(q) && !r.supplier_name.toLowerCase().includes(q)) return false;
    if (dateFrom && r.created_at < dateFrom) return false;
    if (dateTo && r.created_at.slice(0, 10) > dateTo) return false;
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    let av: any, bv: any;
    switch (sortField) {
      case 'return_number':  av = a.return_number;              bv = b.return_number; break;
      case 'created_at':     av = a.created_at;                 bv = b.created_at; break;
      case 'supplier_name':  av = a.supplier_name.toLowerCase();bv = b.supplier_name.toLowerCase(); break;
      case 'grand_total':    av = Number(a.grand_total);        bv = Number(b.grand_total); break;
      default: return 0;
    }
    if (av < bv) return sortDir === 'asc' ? -1 : 1;
    if (av > bv) return sortDir === 'asc' ? 1 : -1;
    return 0;
  });

  const paged = pageSize === 0 ? sorted : sorted.slice((page - 1) * pageSize, page * pageSize);

  const hasFilters = query || dateFrom || dateTo;
  const resetFilters = () => { setQuery(''); setDateFrom(''); setDateTo(''); setPage(1); };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-800">Returns to Supplier</h2>
        <Link href="/returns/new" className="btn-primary text-sm">+ New Return</Link>
      </div>

      <div className="card">
        <div className="flex flex-wrap gap-3 mb-4">
          <input
            className="input flex-1 min-w-48"
            placeholder="Search by return number or supplier…"
            value={query}
            onChange={e => { setQuery(e.target.value); setPage(1); }}
          />
          <input type="date" className="input w-40" value={dateFrom} onChange={e => { setDateFrom(e.target.value); setPage(1); }} title="From date" />
          <input type="date" className="input w-40" value={dateTo}   onChange={e => { setDateTo(e.target.value);   setPage(1); }} title="To date" />
          {hasFilters && <button onClick={resetFilters} className="text-xs text-gray-400 hover:text-danger underline">Clear filters</button>}
        </div>

        {loading ? (
          <div className="text-center py-8 text-gray-400">Loading…</div>
        ) : sorted.length === 0 ? (
          <div className="text-center py-8 text-gray-400">No supplier returns found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <SortableHeader label="Return No"    field="return_number" current={sortField} dir={sortDir} onSort={handleSort} className="rounded-tl" />
                  <SortableHeader label="Date"         field="created_at"    current={sortField} dir={sortDir} onSort={handleSort} />
                  <SortableHeader label="Supplier"     field="supplier_name" current={sortField} dir={sortDir} onSort={handleSort} />
                  <th className="table-header">Original Invoice No</th>
                  <th className="table-header">Credit Note No</th>
                  <SortableHeader label="Grand Total"  field="grand_total"   current={sortField} dir={sortDir} onSort={handleSort} className="text-right rounded-tr" />
                </tr>
              </thead>
              <tbody>
                {paged.map(r => (
                  <tr key={r.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => router.push(`/returns/${r.id}`)}>
                    <td className="table-cell font-medium text-primary">{r.return_number}</td>
                    <td className="table-cell text-gray-500">{formatDateShort(r.created_at)}</td>
                    <td className="table-cell">{r.supplier_name || <span className="text-gray-400">—</span>}</td>
                    <td className="table-cell text-gray-500">{r.supplier_invoice_no || <span className="text-gray-400">—</span>}</td>
                    <td className="table-cell text-gray-500">{r.credit_note_no || <span className="text-gray-400">—</span>}</td>
                    <td className="table-cell text-right font-semibold">{formatINR(Number(r.grand_total))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Pagination total={sorted.length} page={page} pageSize={pageSize} onPageChange={setPage} onPageSizeChange={size => { setPageSize(size); setPage(1); }} />
      </div>
    </div>
  );
}
