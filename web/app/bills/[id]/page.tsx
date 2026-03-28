'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Bill, BillItem } from '@/types/bill';
import { StoreSettings } from '@/types/settings';
import { formatINR } from '@/utils/currency';
import { formatDate } from '@/utils/date';
import { buildInvoiceHTML } from '@/utils/invoice';
import { buildWhatsAppMessage, getWhatsAppUrl } from '@/utils/whatsapp';

export default function BillDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = Number(params.id);

  const [bill, setBill] = useState<(Bill & { items: BillItem[] }) | null>(null);
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [pdfLoading, setPdfLoading] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch(`/api/bills/${id}`).then(r => r.json()),
      fetch('/api/settings').then(r => r.json()),
    ]).then(([billData, settingsData]) => {
      setBill(billData);
      setSettings(settingsData.settings);
    }).finally(() => setLoading(false));
  }, [id]);

  const handlePrint = () => {
    if (!bill || !settings) return;
    const html = buildInvoiceHTML(bill, bill.items ?? [], settings);
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 300);
  };

  const fetchPDFBlob = async (): Promise<Blob> => {
    const res = await fetch(`/api/bills/${id}/pdf`);
    if (!res.ok) throw new Error('PDF generation failed');
    return res.blob();
  };

  const handleDownloadPDF = async () => {
    if (!bill) return;
    setPdfLoading(true);
    try {
      const blob = await fetchPDFBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${bill.bill_number}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setPdfLoading(false);
    }
  };

  const handleWhatsApp = async () => {
    if (!bill || !settings) return;
    setPdfLoading(true);
    try {
      const blob = await fetchPDFBlob();
      const file = new File([blob], `${bill.bill_number}.pdf`, { type: 'application/pdf' });
      const message = buildWhatsAppMessage(bill, bill.items ?? [], settings);

      if (navigator.canShare?.({ files: [file] })) {
        // Native share sheet — user picks WhatsApp (or any app)
        await navigator.share({ files: [file], title: `Bill ${bill.bill_number}`, text: message });
      } else {
        // Fallback: download PDF + open WhatsApp text
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${bill.bill_number}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
        window.open(getWhatsAppUrl(message, bill.customer_phone), '_blank', 'noopener,noreferrer');
      }
    } catch (err) {
      if (err instanceof Error && err.name !== 'AbortError') {
        alert('Failed to share PDF. Please try again.');
      }
    } finally {
      setPdfLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Delete bill ${bill?.bill_number}?`)) return;
    await fetch(`/api/bills/${id}`, { method: 'DELETE' });
    router.push('/bills');
  };

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-400">Loading…</div>;
  if (!bill) return <div className="text-center py-12 text-gray-400">Bill not found.</div>;

  const items = bill.items ?? [];

  return (
    <div className="max-w-3xl space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="text-primary hover:underline text-sm">← Back</button>
          <h2 className="text-xl font-bold text-gray-800">Bill {bill.bill_number}</h2>
        </div>
        <div className="flex gap-2">
          <button onClick={handleWhatsApp} disabled={pdfLoading} className="btn-whatsapp text-sm">
            {pdfLoading ? '⏳ Preparing…' : '💬 WhatsApp PDF'}
          </button>
          <button onClick={handleDownloadPDF} disabled={pdfLoading} className="btn-secondary text-sm">
            {pdfLoading ? '⏳…' : '📄 Download PDF'}
          </button>
          <button onClick={handlePrint} className="btn-secondary text-sm">🖨 Print</button>
          <button onClick={handleDelete} className="btn-danger text-sm">Delete</button>
        </div>
      </div>

      <div className="card space-y-4">
        {/* Header */}
        <div className="flex justify-between text-sm">
          <div>
            <p className="text-gray-500">Bill No.</p>
            <p className="font-bold text-primary text-base">{bill.bill_number}</p>
            {bill.customer_name && (
              <>
                <p className="text-gray-500 mt-2">Customer</p>
                <p className="font-medium">{bill.customer_name}</p>
                {bill.customer_phone && <p className="text-gray-500">{bill.customer_phone}</p>}
                {bill.customer_address && <p className="text-gray-500 text-xs">{bill.customer_address}</p>}
              </>
            )}
            {bill.doctor_name && (
              <>
                <p className="text-gray-500 mt-2">Doctor</p>
                <p className="font-medium">{bill.doctor_name}</p>
              </>
            )}
          </div>
          <div className="text-right">
            <p className="text-gray-500">Date</p>
            <p className="font-medium">{formatDate(bill.created_at)}</p>
            <span className="badge bg-primary-light text-primary mt-1">{bill.payment_mode}</span>
          </div>
        </div>

        {/* Items table */}
        <div className="overflow-x-auto border border-gray-100 rounded">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="table-header">#</th>
                <th className="table-header">Medicine</th>
                <th className="table-header">HSN</th>
                <th className="table-header">Expiry</th>
                <th className="table-header">Manufacturer</th>
                <th className="table-header text-center">Qty</th>
                <th className="table-header text-right">Rate</th>
                <th className="table-header text-center">GST%</th>
                <th className="table-header text-right">GST Amt</th>
                <th className="table-header text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, i) => (
                <tr key={item.id} className={i % 2 === 1 ? 'bg-gray-50' : ''}>
                  <td className="table-cell text-gray-400">{i + 1}</td>
                  <td className="table-cell">
                    <div className="font-medium">{item.medicine_name}</div>
                    {item.batch_no && <div className="text-xs text-gray-400">Batch: {item.batch_no}</div>}
                  </td>
                  <td className="table-cell text-xs text-gray-500">{item.hsn || '—'}</td>
                  <td className="table-cell text-xs text-gray-500">
                    {item.expiry_month && item.expiry_year
                      ? `${String(item.expiry_month).padStart(2, '0')}/${item.expiry_year}`
                      : '—'}
                  </td>
                  <td className="table-cell text-xs text-gray-500">{item.manufacture_name || '—'}</td>
                  <td className="table-cell text-center">{item.qty}</td>
                  <td className="table-cell text-right">{formatINR(Number(item.unit_price))}</td>
                  <td className="table-cell text-center">{item.gst_percent}%</td>
                  <td className="table-cell text-right">{formatINR(Number(item.gst_amount))}</td>
                  <td className="table-cell text-right font-medium">{formatINR(Number(item.line_total))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="flex justify-end">
          <div className="w-56 space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Subtotal (taxable)</span>
              <span>{formatINR(Number(bill.subtotal))}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">GST Total</span>
              <span>{formatINR(Number(bill.gst_total))}</span>
            </div>
            {Number(bill.discount_total) > 0 && (
              <div className="flex justify-between text-success">
                <span>Discount {Number(bill.discount_percent) > 0 ? `(${Number(bill.discount_percent)}%)` : ''}</span>
                <span>- {formatINR(Number(bill.discount_total))}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-primary text-base border-t pt-1">
              <span>Grand Total</span>
              <span>{formatINR(Number(bill.grand_total))}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
