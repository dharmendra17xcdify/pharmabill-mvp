'use client';
import { useEffect, useState } from 'react';
import StatCard from '@/components/StatCard';
import { formatINR } from '@/utils/currency';
import { formatExpiry, isExpired, isExpiringSoon } from '@/utils/date';
import { Medicine } from '@/types/medicine';

interface ReportData {
  today: { total: number; count: number };
  month: { total: number; count: number };
  lowStockCount: number;
  lowStockMedicines: Medicine[];
}

export default function ReportsPage() {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/reports')
      .then(r => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-400">Loading…</div>;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-800">Reports</h2>

      <div>
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Sales Summary</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Today's Revenue" value={formatINR(data?.today?.total ?? 0)} sub={`${data?.today?.count ?? 0} bill(s)`} color="primary" />
          <StatCard label="Today's Bills" value={String(data?.today?.count ?? 0)} color="primary" />
          <StatCard label="Month Revenue" value={formatINR(data?.month?.total ?? 0)} sub={`${data?.month?.count ?? 0} bill(s)`} color="success" />
          <StatCard label="Month Bills" value={String(data?.month?.count ?? 0)} color="success" />
        </div>
      </div>

      <div className="card">
        <h3 className="font-semibold text-gray-700 mb-3">
          Low Stock Medicines
          <span className={`ml-2 badge ${(data?.lowStockCount ?? 0) > 0 ? 'bg-orange-100 text-warning' : 'bg-green-100 text-success'}`}>
            {data?.lowStockCount ?? 0}
          </span>
        </h3>

        {(data?.lowStockMedicines?.length ?? 0) === 0 ? (
          <p className="text-gray-400 text-sm py-4 text-center">All medicines have adequate stock.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="table-header rounded-tl">Medicine</th>
                  <th className="table-header">Batch</th>
                  <th className="table-header">Expiry</th>
                  <th className="table-header text-right">MRP</th>
                  <th className="table-header text-right rounded-tr">Stock</th>
                </tr>
              </thead>
              <tbody>
                {(data!.lowStockMedicines ?? []).map(m => {
                  const expired = isExpired(m.expiry_month, m.expiry_year);
                  const expiring = isExpiringSoon(m.expiry_month, m.expiry_year);
                  return (
                    <tr key={m.id} className="hover:bg-gray-50">
                      <td className="table-cell">
                        <div className="font-medium">{m.name}</div>
                        {m.generic_name && <div className="text-gray-400 text-xs">{m.generic_name}</div>}
                      </td>
                      <td className="table-cell text-gray-500">{m.batch_no || '—'}</td>
                      <td className="table-cell">
                        {m.expiry_month ? (
                          <span className={expired ? 'text-danger font-medium' : expiring ? 'text-warning font-medium' : ''}>
                            {formatExpiry(m.expiry_month, m.expiry_year)}
                            {expired ? ' (Expired)' : expiring ? ' (Soon)' : ''}
                          </span>
                        ) : '—'}
                      </td>
                      <td className="table-cell text-right">{formatINR(Number(m.mrp))}</td>
                      <td className="table-cell text-right">
                        <span className="badge bg-orange-100 text-warning font-bold">{m.stock_qty}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
