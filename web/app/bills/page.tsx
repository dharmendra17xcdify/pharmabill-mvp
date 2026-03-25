'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Bill } from '@/types/bill';
import { formatINR } from '@/utils/currency';
import { formatDateShort } from '@/utils/date';

export default function BillsPage() {
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');

  const load = () => {
    setLoading(true);
    fetch('/api/bills')
      .then(r => r.json())
      .then(data => setBills(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const filtered = query.trim()
    ? bills.filter(
        b =>
          b.bill_number.toLowerCase().includes(query.toLowerCase()) ||
          b.customer_name.toLowerCase().includes(query.toLowerCase())
      )
    : bills;

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
        <input
          className="input mb-4"
          placeholder="Search by bill number or customer…"
          value={query}
          onChange={e => setQuery(e.target.value)}
        />

        {loading ? (
          <div className="text-center py-8 text-gray-400">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-8 text-gray-400">No bills found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="table-header rounded-tl">Bill No.</th>
                  <th className="table-header">Date</th>
                  <th className="table-header">Customer</th>
                  <th className="table-header">Payment</th>
                  <th className="table-header text-right">Total</th>
                  <th className="table-header rounded-tr"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(b => (
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
                        <button
                          onClick={() => handleDelete(b.id!, b.bill_number)}
                          className="text-danger text-xs hover:underline"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
