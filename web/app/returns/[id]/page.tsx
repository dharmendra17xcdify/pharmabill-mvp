'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { SupplierReturn, SupplierReturnItem } from '@/types/supplierReturn';
import { StoreSettings } from '@/types/settings';
import { formatINR } from '@/utils/currency';
import { formatDate } from '@/utils/date';
import { buildCreditNoteHTML } from '@/utils/creditNoteInvoice';

type ReturnWithItems = SupplierReturn & { items: SupplierReturnItem[] };

function numberToWords(amount: number): string {
  const ones = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
    'Seventeen', 'Eighteen', 'Nineteen',
  ];
  const tens = [
    '', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety',
  ];

  function convertBelow100(n: number): string {
    if (n < 20) return ones[n];
    return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + ones[n % 10] : '');
  }

  function convertBelow1000(n: number): string {
    if (n < 100) return convertBelow100(n);
    return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 !== 0 ? ' ' + convertBelow100(n % 100) : '');
  }

  function convertIndian(n: number): string {
    if (n === 0) return 'Zero';
    let result = '';
    const crore = Math.floor(n / 10000000);
    n = n % 10000000;
    const lakh = Math.floor(n / 100000);
    n = n % 100000;
    const thousand = Math.floor(n / 1000);
    n = n % 1000;

    if (crore > 0) result += convertBelow1000(crore) + ' Crore ';
    if (lakh > 0) result += convertBelow1000(lakh) + ' Lakh ';
    if (thousand > 0) result += convertBelow1000(thousand) + ' Thousand ';
    if (n > 0) result += convertBelow1000(n);
    return result.trim();
  }

  const rupees = Math.floor(amount);
  const paise = Math.round((amount - rupees) * 100);

  let words = 'Rupees ' + convertIndian(rupees);
  if (paise > 0) {
    words += ' and ' + convertBelow100(paise) + ' Paise';
  }
  words += ' Only.';
  return words;
}

export default function ReturnDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [ret, setRet] = useState<ReturnWithItems | null>(null);
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      fetch(`/api/supplier-returns/${id}`).then(r => r.json()),
      fetch('/api/settings').then(r => r.json()),
    ])
      .then(([returnData, settingsData]) => {
        if (returnData?.error) {
          setError(returnData.error);
        } else {
          setRet(returnData);
        }
        setSettings(settingsData.settings);
      })
      .catch(() => setError('Failed to load supplier return'))
      .finally(() => setLoading(false));
  }, [id]);

  const handlePrint = () => {
    if (!ret || !settings) return;
    const html = buildCreditNoteHTML(ret, settings);
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

  if (error || !ret) {
    return (
      <div className="space-y-4">
        <button onClick={() => router.back()} className="text-primary text-sm hover:underline">← Back</button>
        <div className="text-center py-12 text-danger">{error || 'Return not found'}</div>
      </div>
    );
  }

  const totalQty = ret.items.reduce((s, it) => s + Number(it.qty), 0);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="text-primary text-sm hover:underline">← Back</button>
          <h2 className="text-xl font-bold text-gray-800">Credit Note {ret.return_number}</h2>
        </div>
        <button onClick={handlePrint} className="btn-primary text-sm">
          🖨 Print / PDF
        </button>
      </div>

      {/* Meta card */}
      <div className="card">
        <div className="grid grid-cols-2 gap-6 text-sm">
          <div className="space-y-1">
            <p><span className="label inline-block w-36">Return No</span><strong>{ret.return_number}</strong></p>
            <p><span className="label inline-block w-36">Date</span>{formatDate(ret.created_at)}</p>
            {ret.credit_note_no && (
              <p><span className="label inline-block w-36">Credit Note No</span>{ret.credit_note_no}</p>
            )}
          </div>
          <div className="space-y-1">
            <p><span className="label inline-block w-40">Supplier</span><strong>{ret.supplier_name || '—'}</strong></p>
            <p><span className="label inline-block w-40">Original Invoice No</span>{ret.supplier_invoice_no || '—'}</p>
            {ret.supplier_gstin && (
              <p><span className="label inline-block w-40">Supplier GSTIN</span>{ret.supplier_gstin}</p>
            )}
            {ret.supplier_phone && (
              <p><span className="label inline-block w-40">Supplier Phone</span>{ret.supplier_phone}</p>
            )}
            {ret.supplier_drug_license && (
              <p><span className="label inline-block w-40">Drug License</span>{ret.supplier_drug_license}</p>
            )}
            {ret.supplier_address && (
              <p><span className="label inline-block w-40">Address</span>{ret.supplier_address}</p>
            )}
          </div>
        </div>
      </div>

      {/* Items table */}
      <div className="card p-0">
        <div className="px-4 py-3 border-b border-gray-100">
          <h3 className="font-semibold text-gray-700">Items ({ret.items.length})</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr>
                <th className="table-header text-center" style={{ width: 32 }}>S.No</th>
                <th className="table-header">Particular</th>
                <th className="table-header" style={{ width: 56 }}>HSN</th>
                <th className="table-header text-center" style={{ width: 60 }}>Expiry</th>
                <th className="table-header text-center" style={{ width: 56 }}>Pack</th>
                <th className="table-header text-center" style={{ width: 40 }}>Qty</th>
                <th className="table-header text-right" style={{ width: 68 }}>Rate</th>
                <th className="table-header text-center" style={{ width: 48 }}>Disc%</th>
                <th className="table-header text-center" style={{ width: 48 }}>CGST%</th>
                <th className="table-header text-center" style={{ width: 48 }}>SGST%</th>
                <th className="table-header text-right" style={{ width: 72 }}>Amount</th>
                <th className="table-header text-right" style={{ width: 64 }}>MRP</th>
                <th className="table-header">Mfg</th>
                <th className="table-header" style={{ width: 90 }}>Return Reason</th>
              </tr>
            </thead>
            <tbody>
              {ret.items.map((item, i) => (
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
                  <td className="table-cell text-right">{formatINR(Number(item.rate))}</td>
                  <td className="table-cell text-center text-gray-600">{Number(item.discount).toFixed(2)}%</td>
                  <td className="table-cell text-center text-gray-600">{Number(item.cgst_percent).toFixed(2)}%</td>
                  <td className="table-cell text-center text-gray-600">{Number(item.sgst_percent).toFixed(2)}%</td>
                  <td className="table-cell text-right font-medium">{formatINR(Number(item.amount))}</td>
                  <td className="table-cell text-right text-gray-600">{formatINR(Number(item.mrp))}</td>
                  <td className="table-cell text-gray-600">{item.manufacture_name || '—'}</td>
                  <td className="table-cell text-gray-600">{item.return_reason || '—'}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-gray-50 font-semibold text-xs">
                <td className="table-cell text-right text-gray-600" colSpan={5}>
                  Total Items: {ret.items.length}
                </td>
                <td className="table-cell text-center">{totalQty}</td>
                <td colSpan={4} className="table-cell"></td>
                <td className="table-cell text-right">{formatINR(Number(ret.grand_total))}</td>
                <td colSpan={3} className="table-cell"></td>
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
            <span>{formatINR(Number(ret.subtotal))}</span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>CGST Total</span>
            <span>{formatINR(Number(ret.cgst_total))}</span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>SGST Total</span>
            <span>{formatINR(Number(ret.sgst_total))}</span>
          </div>
          <div className="flex justify-between text-base font-bold text-primary border-t pt-2">
            <span>Grand Total</span>
            <span>{formatINR(Number(ret.grand_total))}</span>
          </div>
        </div>
      </div>

      {/* Amount in Words */}
      <div className="card text-sm text-gray-600 italic">
        <strong>Amount in Words:</strong> {numberToWords(Number(ret.grand_total))}
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
