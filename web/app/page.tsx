'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import StatCard from '@/components/StatCard';
import { formatINR } from '@/utils/currency';
import { formatExpiry, isExpired, isExpiringSoon } from '@/utils/date';
import { LOW_STOCK_THRESHOLD } from '@/constants/paymentModes';
import { Medicine } from '@/types/medicine';

interface DashboardData {
  today: { total: number; count: number };
  month: { total: number; count: number };
  lowStockCount: number;
  lowStockMedicines: Medicine[];
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/reports')
      .then(r => r.json())
      .then(d => setData(d))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-gray-400">Loading…</div>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-800">Dashboard</h2>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Today's Sales"
          value={formatINR(data?.today?.total ?? 0)}
          sub={`${data?.today?.count ?? 0} bill(s)`}
          color="primary"
        />
        <StatCard
          label="Month Sales"
          value={formatINR(data?.month?.total ?? 0)}
          sub={`${data?.month?.count ?? 0} bill(s)`}
          color="success"
        />
        <StatCard
          label="Low Stock"
          value={String(data?.lowStockCount ?? 0)}
          sub={`≤ ${LOW_STOCK_THRESHOLD} units`}
          color={(data?.lowStockCount ?? 0) > 0 ? 'warning' : 'success'}
        />
      </div>

      {/* Quick actions */}
      <div className="card">
        <h3 className="font-semibold text-gray-700 mb-3">Quick Actions</h3>
        <div className="flex flex-wrap gap-3">
          <Link href="/billing/new" className="btn-primary text-sm">
            + New Bill
          </Link>
          <Link href="/medicines/add" className="btn-secondary text-sm">
            + Add Medicine
          </Link>
          <Link href="/bills" className="btn-secondary text-sm">
            View Bills
          </Link>
        </div>
      </div>

      {/* Low stock */}
      {(data?.lowStockMedicines?.length ?? 0) > 0 && (
        <div className="card">
          <h3 className="font-semibold text-warning mb-3">
            ⚠️ Low Stock Medicines ({data!.lowStockMedicines?.length ?? 0})
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="table-header rounded-tl">Medicine</th>
                  <th className="table-header">Batch</th>
                  <th className="table-header">Expiry</th>
                  <th className="table-header rounded-tr text-right">Stock</th>
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
                      <td className="table-cell text-right">
                        <span className="badge bg-orange-100 text-warning font-bold">
                          {m.stock_qty}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
