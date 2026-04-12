'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
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

  const lowStockCount = data?.lowStockCount ?? 0;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-gray-800">Dashboard</h1>

      {/* Stat cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-5 rounded-xl shadow hover:shadow-lg transition">
          <div className="text-gray-500 text-sm">Today's Sales</div>
          <div className="text-2xl font-bold text-blue-600 mt-2">{formatINR(data?.today?.total ?? 0)}</div>
          <div className="text-sm text-gray-400 mt-1">{data?.today?.count ?? 0} bill(s)</div>
        </div>
        <div className="bg-white p-5 rounded-xl shadow hover:shadow-lg transition">
          <div className="text-gray-500 text-sm">Month Sales</div>
          <div className="text-2xl font-bold text-green-600 mt-2">{formatINR(data?.month?.total ?? 0)}</div>
          <div className="text-sm text-gray-400 mt-1">{data?.month?.count ?? 0} bill(s)</div>
        </div>
        <div className="bg-white p-5 rounded-xl shadow hover:shadow-lg transition">
          <div className="text-gray-500 text-sm">Low Stock</div>
          <div className={`text-2xl font-bold mt-2 ${lowStockCount > 0 ? 'text-red-500' : 'text-green-600'}`}>
            {lowStockCount}
          </div>
          <div className="text-sm text-gray-400 mt-1">≤ {LOW_STOCK_THRESHOLD} units</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white p-5 rounded-xl shadow">
        <h2 className="font-semibold text-gray-800 mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <Link href="/billing/new" className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 transition text-sm font-medium">
            + New Bill
          </Link>
          <Link href="/medicines/add" className="border border-gray-300 px-5 py-2 rounded-lg hover:bg-gray-100 transition text-sm font-medium text-gray-700">
            + Add Item
          </Link>
          <Link href="/bills" className="border border-gray-300 px-5 py-2 rounded-lg hover:bg-gray-100 transition text-sm font-medium text-gray-700">
            View Bills
          </Link>
        </div>
      </div>

      {/* Low Stock Table */}
      {(data?.lowStockMedicines?.length ?? 0) > 0 && (
        <div className="bg-white p-5 rounded-xl shadow">
          <h2 className="font-semibold text-red-500 mb-4">
            ⚠ Low Stock Items ({data!.lowStockMedicines.length})
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="p-3 font-semibold text-gray-600">Item</th>
                  <th className="p-3 font-semibold text-gray-600">Batch</th>
                  <th className="p-3 font-semibold text-gray-600">Expiry</th>
                  <th className="p-3 font-semibold text-gray-600">Stock</th>
                </tr>
              </thead>
              <tbody>
                {data!.lowStockMedicines.map(m => {
                  const expired  = isExpired(m.expiry_month, m.expiry_year);
                  const expiring = isExpiringSoon(m.expiry_month, m.expiry_year);
                  const stockColor = m.stock_qty <= 2
                    ? 'bg-red-100 text-red-600'
                    : 'bg-yellow-100 text-yellow-600';
                  return (
                    <tr key={`${m.id}-${m.batch_id}`} className="border-b last:border-0 hover:bg-gray-50">
                      <td className="p-3">
                        <div className="font-medium text-gray-800">{m.name}</div>
                        {m.generic_name && <div className="text-xs text-gray-400">{m.generic_name}</div>}
                      </td>
                      <td className="p-3 text-gray-600">{m.batch_no || '—'}</td>
                      <td className="p-3">
                        {m.expiry_month ? (
                          <span className={expired ? 'text-red-500 font-medium' : expiring ? 'text-yellow-600 font-medium' : 'text-gray-600'}>
                            {formatExpiry(m.expiry_month, m.expiry_year)}
                            {expired ? ' (Expired)' : expiring ? ' (Soon)' : ''}
                          </span>
                        ) : <span className="text-gray-400">—</span>}
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${stockColor}`}>
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
