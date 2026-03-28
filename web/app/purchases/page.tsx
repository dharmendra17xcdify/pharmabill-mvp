'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Purchase } from '@/types/purchase';
import { formatINR } from '@/utils/currency';
import { formatDateShort } from '@/utils/date';

export default function PurchasesPage() {
  const router = useRouter();
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch('/api/purchases')
      .then(r => r.json())
      .then(data => setPurchases(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-800">Purchases / GRN</h2>
        <Link href="/purchases/new" className="btn-primary text-sm">+ New Purchase</Link>
      </div>

      <div className="card">
        {loading ? (
          <div className="text-center py-8 text-gray-400">Loading…</div>
        ) : purchases.length === 0 ? (
          <div className="text-center py-8 text-gray-400">No purchases found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="table-header rounded-tl">Purchase No</th>
                  <th className="table-header">Date</th>
                  <th className="table-header">Supplier</th>
                  <th className="table-header">Invoice No</th>
                  <th className="table-header">Payment</th>
                  <th className="table-header text-right rounded-tr">Grand Total</th>
                </tr>
              </thead>
              <tbody>
                {purchases.map(p => (
                  <tr
                    key={p.id}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => router.push(`/purchases/${p.id}`)}
                  >
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
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
