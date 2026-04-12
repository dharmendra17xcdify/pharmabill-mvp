'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Bill } from '@/types/bill';
import { formatINR } from '@/utils/currency';
import { formatDateShort } from '@/utils/date';
import Pagination from '@/components/Pagination';
import SortableHeader, { SortDir } from '@/components/SortableHeader';
import { PAYMENT_MODES } from '@/constants/paymentModes';

export default function BillsPage() {
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sortField, setSortField] = useState('created_at');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const load = () => {
    setLoading(true);
    fetch('/api/bills')
      .then(r => r.json())
      .then(data => setBills(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleSort = (field: string) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir(field === 'created_at' ? 'desc' : 'asc'); }
    setPage(1);
  };

  const filtered = bills.filter(b => {
    const q = query.trim().toLowerCase();
    if (q && !b.bill_number.toLowerCase().includes(q) && !(b.customer_name ?? '').toLowerCase().includes(q)) return false;
    if (paymentFilter && b.payment_mode !== paymentFilter) return false;
    if (dateFrom && b.created_at < dateFrom) return false;
    if (dateTo && b.created_at.slice(0, 10) > dateTo) return false;
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    let av: any, bv: any;
    switch (sortField) {
      case 'bill_number':  av = a.bill_number;               bv = b.bill_number; break;
      case 'created_at':   av = a.created_at;                bv = b.created_at; break;
      case 'customer_name':av = (a.customer_name ?? '').toLowerCase(); bv = (b.customer_name ?? '').toLowerCase(); break;
      case 'grand_total':  av = Number(a.grand_total);       bv = Number(b.grand_total); break;
      default: return 0;
    }
    if (av < bv) return sortDir === 'asc' ? -1 : 1;
    if (av > bv) return sortDir === 'asc' ? 1 : -1;
    return 0;
  });

  const paged = pageSize === 0 ? sorted : sorted.slice((page - 1) * pageSize, page * pageSize);

  const hasFilters = query || paymentFilter || dateFrom || dateTo;
  const resetFilters = () => { setQuery(''); setPaymentFilter(''); setDateFrom(''); setDateTo(''); setPage(1); };

  const handleDelete = async (id: number, billNo: string) => {
    if (!confirm(`Delete bill ${billNo}?`)) return;
    await fetch(`/api/bills/${id}`, { method: 'DELETE' });
    load();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-800">Bills History</h2>
        <Link href="/billing/new" className="btn-primary text-sm">+ New Bill</Link>
      </div>

      <div className="card">
        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-4">
          <input
            className="input flex-1 min-w-48"
            placeholder="Search by bill number or customer…"
            value={query}
            onChange={e => { setQuery(e.target.value); setPage(1); }}
          />
          <select className="input w-36" value={paymentFilter} onChange={e => { setPaymentFilter(e.target.value); setPage(1); }}>
            <option value="">All Payments</option>
            {PAYMENT_MODES.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
          <input type="date" className="input w-40" value={dateFrom} onChange={e => { setDateFrom(e.target.value); setPage(1); }} title="From date" />
          <input type="date" className="input w-40" value={dateTo}   onChange={e => { setDateTo(e.target.value);   setPage(1); }} title="To date" />
          {hasFilters && <button onClick={resetFilters} className="text-xs text-gray-400 hover:text-danger underline">Clear filters</button>}
        </div>

        {loading ? (
          <div className="text-center py-8 text-gray-400">Loading…</div>
        ) : sorted.length === 0 ? (
          <div className="text-center py-8 text-gray-400">No bills found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <SortableHeader label="Bill No."  field="bill_number"   current={sortField} dir={sortDir} onSort={handleSort} className="rounded-tl" />
                  <SortableHeader label="Date"      field="created_at"    current={sortField} dir={sortDir} onSort={handleSort} />
                  <SortableHeader label="Customer"  field="customer_name" current={sortField} dir={sortDir} onSort={handleSort} />
                  <th className="table-header">Payment</th>
                  <SortableHeader label="Total"     field="grand_total"   current={sortField} dir={sortDir} onSort={handleSort} className="text-right" />
                  <th className="table-header rounded-tr"></th>
                </tr>
              </thead>
              <tbody>
                {paged.map(b => (
                  <tr key={b.id} className="hover:bg-gray-50">
                    <td className="table-cell font-medium text-primary">{b.bill_number}</td>
                    <td className="table-cell text-gray-500">{formatDateShort(b.created_at)}</td>
                    <td className="table-cell">{b.customer_name || <span className="text-gray-400">—</span>}</td>
                    <td className="table-cell">
                      <span className="badge bg-primary-light text-primary">{b.payment_mode}</span>
                    </td>
                    <td className="table-cell text-right font-semibold">{formatINR(Number(b.grand_total))}</td>
                    <td className="table-cell">
                      <div className="flex gap-2">
                        <Link href={`/bills/${b.id}`} className="text-primary text-xs hover:underline">View</Link>
                        <button onClick={() => handleDelete(b.id!, b.bill_number)} className="text-danger text-xs hover:underline">Delete</button>
                      </div>
                    </td>
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
