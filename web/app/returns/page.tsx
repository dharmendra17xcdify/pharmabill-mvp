'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { SupplierReturn } from '@/types/supplierReturn';
import { formatINR } from '@/utils/currency';
import { formatDateShort } from '@/utils/date';

export default function ReturnsPage() {
  const router = useRouter();
  const [returns, setReturns] = useState<SupplierReturn[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch('/api/supplier-returns')
      .then(r => r.json())
      .then(data => setReturns(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-800">Returns to Supplier</h2>
        <Link href="/returns/new" className="btn-primary text-sm">+ New Return</Link>
      </div>

      <div className="card">
        {loading ? (
          <div className="text-center py-8 text-gray-400">Loading…</div>
        ) : returns.length === 0 ? (
          <div className="text-center py-8 text-gray-400">No supplier returns found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="table-header rounded-tl">Return No</th>
                  <th className="table-header">Date</th>
                  <th className="table-header">Supplier</th>
                  <th className="table-header">Original Invoice No</th>
                  <th className="table-header">Credit Note No</th>
                  <th className="table-header text-right rounded-tr">Grand Total</th>
                </tr>
              </thead>
              <tbody>
                {returns.map(r => (
                  <tr
                    key={r.id}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => router.push(`/returns/${r.id}`)}
                  >
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
      </div>
    </div>
  );
}
