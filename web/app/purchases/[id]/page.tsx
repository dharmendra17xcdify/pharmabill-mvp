'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Purchase, PurchaseItem } from '@/types/purchase';
import { StoreSettings } from '@/types/settings';
import { formatINR } from '@/utils/currency';
import { formatDate } from '@/utils/date';
import { buildPurchaseInvoiceHTML } from '@/utils/purchaseInvoice';

type PurchaseWithItems = Purchase & { items: PurchaseItem[] };

export default function PurchaseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [purchase, setPurchase] = useState<PurchaseWithItems | null>(null);
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      fetch(`/api/purchases/${id}`).then(r => r.json()),
      fetch('/api/settings').then(r => r.json()),
    ])
      .then(([purchaseData, settingsData]) => {
        if (purchaseData?.error) {
          setError(purchaseData.error);
        } else {
          setPurchase(purchaseData);
        }
        setSettings(settingsData.settings);
      })
      .catch(() => setError('Failed to load purchase'))
      .finally(() => setLoading(false));
  }, [id]);

  const handlePrint = () => {
    if (!purchase || !settings) return;
    const html = buildPurchaseInvoiceHTML(purchase, settings);
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(html);
    win.document.close();
    win.focus();
    win.print();
  };

  if (loading) {
    return <div className="text-center py-12 text-gray-400">Loading…</div>;
  }

  if (error || !purchase) {
    return (
      <div className="space-y-4">
        <button onClick={() => router.back()} className="text-primary text-sm hover:underline">← Back</button>
        <div className="text-center py-12 text-danger">{error || 'Purchase not found'}</div>
      </div>
    );
  }

  const totalQty = purchase.items.reduce((s, it) => s + Number(it.qty), 0);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="text-primary text-sm hover:underline">← Back</button>
          <h2 className="text-xl font-bold text-gray-800">Purchase {purchase.purchase_number}</h2>
        </div>
        <div className="flex gap-2">
          <button onClick={() => router.push(`/purchases/${id}/edit`)} className="btn-secondary text-sm">Edit</button>
          <button onClick={handlePrint} className="btn-primary text-sm">🖨 Print / PDF</button>
        </div>
      </div>

      {/* Meta card */}
      <div className="card">
        <div className="grid grid-cols-2 gap-6 text-sm">
          <div className="space-y-1">
            <p><span className="label inline-block w-32">Purchase No</span><strong>{purchase.purchase_number}</strong></p>
            <p><span className="label inline-block w-32">Date</span>{formatDate(purchase.created_at)}</p>
            <p><span className="label inline-block w-32">Payment Mode</span>
              <span className="badge bg-primary-light text-primary">{purchase.payment_mode}</span>
            </p>
          </div>
          <div className="space-y-1">
            <p><span className="label inline-block w-36">Supplier</span><strong>{purchase.supplier_name || '—'}</strong></p>
            <p><span className="label inline-block w-36">Invoice No</span>{purchase.supplier_invoice_no || '—'}</p>
            <p><span className="label inline-block w-36">Supplier GSTIN</span>{purchase.supplier_gstin || '—'}</p>
            {purchase.supplier_phone && (
              <p><span className="label inline-block w-36">Contact No.</span>{purchase.supplier_phone}</p>
            )}
            {purchase.supplier_drug_license && (
              <p><span className="label inline-block w-36">Drug License</span>{purchase.supplier_drug_license}</p>
            )}
            {purchase.supplier_address && (
              <p><span className="label inline-block w-36">Address</span><span className="text-xs text-gray-600">{purchase.supplier_address}</span></p>
            )}
          </div>
        </div>
      </div>

      {/* Items table */}
      <div className="card p-0">
        <div className="px-4 py-3 border-b border-gray-100">
          <h3 className="font-semibold text-gray-700">Items ({purchase.items.length})</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr>
                <th className="table-header text-center" style={{ width: 32 }}>S.No</th>
                <th className="table-header">Particular</th>
                <th className="table-header" style={{ width: 64 }}>HSN</th>
                <th className="table-header text-center" style={{ width: 60 }}>Expiry</th>
                <th className="table-header text-center" style={{ width: 56 }}>Pack</th>
                <th className="table-header text-center" style={{ width: 40 }}>Qty</th>
                <th className="table-header text-center" style={{ width: 40 }}>Deal</th>
                <th className="table-header text-right" style={{ width: 68 }}>Rate</th>
                <th className="table-header text-center" style={{ width: 48 }}>Disc%</th>
                <th className="table-header text-center" style={{ width: 48 }}>CGST%</th>
                <th className="table-header text-center" style={{ width: 48 }}>SGST%</th>
                <th className="table-header text-right" style={{ width: 72 }}>Amount</th>
                <th className="table-header text-right" style={{ width: 64 }}>MRP</th>
                <th className="table-header">Mfg</th>
              </tr>
            </thead>
            <tbody>
              {purchase.items.map((item, i) => (
                <tr key={item.id ?? i} className="hover:bg-gray-50">
                  <td className="table-cell text-center text-gray-500">{i + 1}</td>
                  <td className="table-cell">
                    <div className="font-medium">{item.medicine_name}</div>
                    {item.batch_no && <div className="text-gray-400">Batch: {item.batch_no}</div>}
                  </td>
                  <td className="table-cell text-xs text-gray-500">{item.hsn || '—'}</td>
                  <td className="table-cell text-center text-gray-600">
                    {item.expiry_month && item.expiry_year
                      ? `${String(item.expiry_month).padStart(2, '0')}/${item.expiry_year}`
                      : '—'}
                  </td>
                  <td className="table-cell text-center">{item.packing || '—'}</td>
                  <td className="table-cell text-center font-medium">{item.qty}</td>
                  <td className="table-cell text-center text-gray-600">{item.deal_qty || 0}</td>
                  <td className="table-cell text-right">{formatINR(Number(item.rate))}</td>
                  <td className="table-cell text-center text-gray-600">{Number(item.discount).toFixed(2)}%</td>
                  <td className="table-cell text-center text-gray-600">{Number(item.cgst_percent).toFixed(2)}%</td>
                  <td className="table-cell text-center text-gray-600">{Number(item.sgst_percent).toFixed(2)}%</td>
                  <td className="table-cell text-right font-medium">{formatINR(Number(item.amount))}</td>
                  <td className="table-cell text-right text-gray-600">{formatINR(Number(item.mrp))}</td>
                  <td className="table-cell text-gray-600">{item.manufacture_name || '—'}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-gray-50 font-semibold text-xs">
                <td className="table-cell text-right text-gray-600" colSpan={5}>
                  Total Items: {purchase.items.length}
                </td>
                <td className="table-cell text-center">{totalQty}</td>
                <td colSpan={5} className="table-cell"></td>
                <td className="table-cell text-right">{formatINR(Number(purchase.grand_total))}</td>
                <td colSpan={2} className="table-cell"></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Totals */}
      <div className="flex justify-end">
        <div className="card w-72 space-y-2 text-sm">
          <div className="flex justify-between text-gray-600">
            <span>Subtotal (Taxable)</span>
            <span>{formatINR(Number(purchase.subtotal))}</span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>CGST Total</span>
            <span>{formatINR(Number(purchase.cgst_total))}</span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>SGST Total</span>
            <span>{formatINR(Number(purchase.sgst_total))}</span>
          </div>
          {Number(purchase.discount_total) > 0 && (
            <div className="flex justify-between text-gray-600">
              <span>Discount</span>
              <span>- {formatINR(Number(purchase.discount_total))}</span>
            </div>
          )}
          <div className="flex justify-between text-base font-bold text-primary border-t pt-2">
            <span>Grand Total</span>
            <span>{formatINR(Number(purchase.grand_total))}</span>
          </div>
        </div>
      </div>

      {/* Signature */}
      <div className="flex justify-end mt-8 pb-4">
        <div className="text-center">
          <div className="border-t border-gray-500 w-40 mx-auto mb-1"></div>
          <p className="text-xs font-semibold text-gray-700">Authorized Signatory</p>
          {settings?.store_name && <p className="text-xs text-gray-500">{settings.store_name}</p>}
        </div>
      </div>
    </div>
  );
}
