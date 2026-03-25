'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useMedicineStore } from '@/store/useMedicineStore';
import { formatINR } from '@/utils/currency';
import { formatExpiry, isExpired, isExpiringSoon } from '@/utils/date';

export default function MedicinesPage() {
  const { medicines, isLoading, loadMedicines, deleteMedicine } = useMedicineStore();
  const [query, setQuery] = useState('');

  useEffect(() => { loadMedicines(); }, []);

  const filtered = query.trim()
    ? medicines.filter(
        m =>
          m.name.toLowerCase().includes(query.toLowerCase()) ||
          m.generic_name.toLowerCase().includes(query.toLowerCase())
      )
    : medicines;

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Delete "${name}"?`)) return;
    await deleteMedicine(id);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-800">Medicines</h2>
        <Link href="/medicines/add" className="btn-primary text-sm">+ Add Medicine</Link>
      </div>

      <div className="card">
        <input
          className="input mb-4"
          placeholder="Search by name or generic name…"
          value={query}
          onChange={e => setQuery(e.target.value)}
        />

        {isLoading ? (
          <div className="text-center py-8 text-gray-400">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-8 text-gray-400">No medicines found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="table-header rounded-tl">Name</th>
                  <th className="table-header">Batch</th>
                  <th className="table-header">Expiry</th>
                  <th className="table-header">MRP</th>
                  <th className="table-header">Selling</th>
                  <th className="table-header">GST</th>
                  <th className="table-header">Stock</th>
                  <th className="table-header rounded-tr"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(m => {
                  const expired = isExpired(m.expiry_month, m.expiry_year);
                  const expiring = isExpiringSoon(m.expiry_month, m.expiry_year);
                  const lowStock = m.stock_qty <= 10;
                  return (
                    <tr key={m.id} className="hover:bg-gray-50">
                      <td className="table-cell">
                        <div className="font-medium">{m.name}</div>
                        {m.generic_name && (
                          <div className="text-gray-400 text-xs">{m.generic_name}</div>
                        )}
                      </td>
                      <td className="table-cell text-gray-500">{m.batch_no || '—'}</td>
                      <td className="table-cell">
                        {m.expiry_month ? (
                          <span className={expired ? 'text-danger font-medium' : expiring ? 'text-warning font-medium' : ''}>
                            {formatExpiry(m.expiry_month, m.expiry_year)}
                            {expired ? ' ⚠' : expiring ? ' ⚡' : ''}
                          </span>
                        ) : '—'}
                      </td>
                      <td className="table-cell">{formatINR(Number(m.mrp))}</td>
                      <td className="table-cell">{formatINR(Number(m.selling_price))}</td>
                      <td className="table-cell">{m.gst_percent}%</td>
                      <td className="table-cell">
                        <span className={`badge ${lowStock ? 'bg-orange-100 text-warning' : 'bg-green-100 text-success'}`}>
                          {m.stock_qty}
                        </span>
                      </td>
                      <td className="table-cell">
                        <div className="flex gap-2">
                          <Link
                            href={`/medicines/${m.id}`}
                            className="text-primary text-xs hover:underline"
                          >
                            Edit
                          </Link>
                          <button
                            onClick={() => handleDelete(m.id!, m.name)}
                            className="text-danger text-xs hover:underline"
                          >
                            Delete
                          </button>
                        </div>
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
