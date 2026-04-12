'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import dayjs from 'dayjs';
import { Purchase } from '@/types/purchase';
import { formatINR } from '@/utils/currency';
import { formatDateShort } from '@/utils/date';
import Pagination from '@/components/Pagination';
import SortableHeader, { SortDir } from '@/components/SortableHeader';
import { PAYMENT_MODES } from '@/constants/paymentModes';


interface MonthGroup {
  label: string;
  key: string;
  purchases: Purchase[];
  total: number;
}

function groupByMonth(purchases: Purchase[]): MonthGroup[] {
  const map = new Map<string, Purchase[]>();
  for (const p of purchases) {
    const key = dayjs(p.created_at).format('YYYY-MM');
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(p);
  }
  return Array.from(map.entries())
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([key, list]) => ({
      key,
      label: dayjs(key + '-01').format('MMMM YYYY'),
      purchases: list,
      total: list.reduce((s, p) => s + Number(p.grand_total), 0),
    }));
}

export default function PurchasesPage() {
  const router = useRouter();
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [openMonths, setOpenMonths] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sortField, setSortField] = useState('created_at');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  useEffect(() => {
    setLoading(true);
    fetch('/api/purchases')
      .then(r => r.json())
      .then(data => {
        const list: Purchase[] = Array.isArray(data) ? data : [];
        setPurchases(list);
        if (list.length > 0) {
          const latestKey = dayjs(list[0].created_at).format('YYYY-MM');
          setOpenMonths(new Set([latestKey]));
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSort = (field: string) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir(field === 'created_at' ? 'desc' : 'asc'); }
    setPage(1);
  };

  const filtered = purchases.filter(p => {
    const q = query.trim().toLowerCase();
    if (q && !p.purchase_number.toLowerCase().includes(q) && !(p.supplier_name ?? '').toLowerCase().includes(q) && !(p.supplier_invoice_no ?? '').toLowerCase().includes(q)) return false;
    if (paymentFilter && p.payment_mode !== paymentFilter) return false;
    if (dateFrom && p.created_at < dateFrom) return false;
    if (dateTo && p.created_at.slice(0, 10) > dateTo) return false;
    return true;
  });

  // Sort before grouping
  const sortedAll = [...filtered].sort((a, b) => {
    let av: any, bv: any;
    switch (sortField) {
      case 'purchase_number': av = a.purchase_number;                    bv = b.purchase_number; break;
      case 'created_at':      av = a.created_at;                         bv = b.created_at; break;
      case 'supplier_name':   av = (a.supplier_name ?? '').toLowerCase();bv = (b.supplier_name ?? '').toLowerCase(); break;
      case 'grand_total':     av = Number(a.grand_total);                bv = Number(b.grand_total); break;
      default: return 0;
    }
    if (av < bv) return sortDir === 'asc' ? -1 : 1;
    if (av > bv) return sortDir === 'asc' ? 1 : -1;
    return 0;
  });

  const groups = groupByMonth(sortedAll);
  const pagedGroups = pageSize === 0 ? groups : groups.slice((page - 1) * pageSize, page * pageSize);

  const toggleMonth = (key: string) =>
    setOpenMonths(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });

  const grandTotal = purchases.reduce((s, p) => s + Number(p.grand_total), 0);
  const hasFilters = query || paymentFilter || dateFrom || dateTo;
  const resetFilters = () => { setQuery(''); setPaymentFilter(''); setDateFrom(''); setDateTo(''); setPage(1); };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-800">Purchases / GRN</h2>
        <Link href="/purchases/new" className="btn-primary text-sm">+ New Purchase</Link>
      </div>

      {!loading && purchases.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <div className="card py-3 text-center">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Total Orders</p>
            <p className="text-2xl font-bold text-gray-800 mt-1">{purchases.length}</p>
          </div>
          <div className="card py-3 text-center">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Months</p>
            <p className="text-2xl font-bold text-gray-800 mt-1">{groups.length}</p>
          </div>
          <div className="card py-3 text-center">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Total Value</p>
            <p className="text-2xl font-bold text-primary mt-1">{formatINR(grandTotal)}</p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="card text-center py-8 text-gray-400">Loading…</div>
      ) : purchases.length === 0 ? (
        <div className="card text-center py-8 text-gray-400">No purchases found.</div>
      ) : (
        <>
          {/* Filters */}
          <div className="card">
            <div className="flex flex-wrap gap-3">
              <input
                className="input flex-1 min-w-48"
                placeholder="Search by purchase number, supplier, invoice no…"
                value={query}
                onChange={e => { setQuery(e.target.value); setPage(1); }}
              />
              <select className="input w-36" value={paymentFilter} onChange={e => { setPaymentFilter(e.target.value); setPage(1); }}>
                <option value="">All Payments</option>
                {PAYMENT_MODES.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
              <input type="date" className="input w-40" value={dateFrom} onChange={e => { setDateFrom(e.target.value); setPage(1); }} title="From date" />
              <input type="date" className="input w-40" value={dateTo}   onChange={e => { setDateTo(e.target.value);   setPage(1); }} title="To date" />
              {hasFilters && <button onClick={resetFilters} className="text-xs text-gray-400 hover:text-danger underline self-center">Clear filters</button>}
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="card text-center py-8 text-gray-400">No purchases match your filters.</div>
          ) : (
            <>
              <div className="space-y-3">
                {pagedGroups.map(group => {
                  const isOpen = openMonths.has(group.key);
                  return (
                    <div key={group.key} className="card p-0 overflow-hidden">
                      <button
                        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
                        onClick={() => toggleMonth(group.key)}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-gray-400 text-xs">{isOpen ? '▼' : '▶'}</span>
                          <span className="font-semibold text-gray-700">{group.label}</span>
                          <span className="text-xs text-gray-400 bg-gray-200 rounded-full px-2 py-0.5">
                            {group.purchases.length} order{group.purchases.length !== 1 ? 's' : ''}
                          </span>
                        </div>
                        <span className="font-bold text-primary">{formatINR(group.total)}</span>
                      </button>

                      {isOpen && (
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr>
                                <SortableHeader label="Purchase No" field="purchase_number" current={sortField} dir={sortDir} onSort={handleSort} />
                                <SortableHeader label="Date"        field="created_at"      current={sortField} dir={sortDir} onSort={handleSort} />
                                <SortableHeader label="Supplier"    field="supplier_name"   current={sortField} dir={sortDir} onSort={handleSort} />
                                <th className="table-header">Invoice No</th>
                                <th className="table-header">Payment</th>
                                <SortableHeader label="Grand Total" field="grand_total"     current={sortField} dir={sortDir} onSort={handleSort} className="text-right" />
                              </tr>
                            </thead>
                            <tbody>
                              {group.purchases.map(p => (
                                <tr key={p.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => router.push(`/purchases/${p.id}`)}>
                                  <td className="table-cell font-medium text-primary">{p.purchase_number}</td>
                                  <td className="table-cell text-gray-500">{formatDateShort(p.created_at)}</td>
                                  <td className="table-cell">{p.supplier_name || <span className="text-gray-400">—</span>}</td>
                                  <td className="table-cell text-gray-500">{p.supplier_invoice_no || <span className="text-gray-400">—</span>}</td>
                                  <td className="table-cell">
                                    <span className="badge bg-primary-light text-primary">{p.payment_mode}</span>
                                  </td>
                                  <td className="table-cell text-right font-semibold">{formatINR(Number(p.grand_total))}</td>
                                </tr>
                              ))}
                            </tbody>
                            <tfoot>
                              <tr className="bg-gray-50 border-t">
                                <td colSpan={5} className="px-4 py-2 text-xs text-gray-500 font-medium text-right">{group.label} Total</td>
                                <td className="px-4 py-2 text-right font-bold text-primary">{formatINR(group.total)}</td>
                              </tr>
                            </tfoot>
                          </table>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="card">
                <Pagination total={groups.length} page={page} pageSize={pageSize} onPageChange={setPage} onPageSizeChange={size => { setPageSize(size); setPage(1); }} />
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
