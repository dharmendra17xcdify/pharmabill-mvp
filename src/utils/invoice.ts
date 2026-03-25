import { Bill, BillItem } from '../types/bill';
import { StoreSettings } from '../types/settings';
import { formatDate, formatExpiry } from './date';

export function buildInvoiceHTML(
  bill: Bill,
  items: BillItem[],
  settings: StoreSettings
): string {
  const itemRows = items
    .map(
      (item, i) => `
    <tr>
      <td>${i + 1}</td>
      <td>
        <strong>${item.medicine_name}</strong>
        ${item.batch_no ? `<br/><small>Batch: ${item.batch_no}</small>` : ''}
      </td>
      <td style="text-align:center">${item.qty}</td>
      <td style="text-align:right">₹${item.unit_price.toFixed(2)}</td>
      <td style="text-align:center">${item.gst_percent}%</td>
      <td style="text-align:right">₹${item.gst_amount.toFixed(2)}</td>
      <td style="text-align:right">₹${item.line_total.toFixed(2)}</td>
    </tr>`
    )
    .join('');

  const gstinLine = settings.gstin ? `<p>GSTIN: ${settings.gstin}</p>` : '';
  const licLine = settings.drug_license ? `<p>Drug License: ${settings.drug_license}</p>` : '';
  const customerLine =
    bill.customer_name
      ? `<p><strong>Customer:</strong> ${bill.customer_name}${bill.customer_phone ? ` | ${bill.customer_phone}` : ''}</p>`
      : '';

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>Invoice ${bill.bill_number}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, sans-serif; font-size: 13px; color: #222; padding: 20px; }
    .header { text-align: center; margin-bottom: 16px; }
    .header h1 { font-size: 22px; color: #1565C0; letter-spacing: 1px; }
    .header p { font-size: 12px; color: #555; margin-top: 2px; }
    .divider { border: none; border-top: 1px dashed #aaa; margin: 10px 0; }
    .bill-meta { display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 12px; }
    table { width: 100%; border-collapse: collapse; margin: 12px 0; }
    th { background: #1565C0; color: white; padding: 6px 4px; font-size: 11px; }
    td { padding: 5px 4px; border-bottom: 1px solid #eee; vertical-align: top; font-size: 12px; }
    tr:nth-child(even) td { background: #F5F5F5; }
    .totals { margin-top: 8px; float: right; min-width: 220px; }
    .totals table { font-size: 13px; }
    .totals td { border: none; padding: 3px 6px; }
    .totals .grand { font-size: 15px; font-weight: bold; color: #1565C0; border-top: 2px solid #1565C0; }
    .footer { clear: both; margin-top: 30px; text-align: center; font-size: 11px; color: #888; }
    .payment-badge { display: inline-block; background: #E3F2FD; color: #1565C0; padding: 3px 10px; border-radius: 4px; font-weight: bold; margin-top: 4px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>${settings.store_name.toUpperCase()}</h1>
    ${settings.owner_name ? `<p>${settings.owner_name}</p>` : ''}
    ${settings.phone ? `<p>Tel: ${settings.phone}</p>` : ''}
    ${settings.address ? `<p>${settings.address}</p>` : ''}
    ${gstinLine}
    ${licLine}
  </div>
  <hr class="divider"/>
  <div class="bill-meta">
    <div>
      <strong>Bill No:</strong> ${bill.bill_number}<br/>
      ${customerLine}
    </div>
    <div style="text-align:right">
      <strong>Date:</strong> ${formatDate(bill.created_at)}<br/>
      <span class="payment-badge">${bill.payment_mode}</span>
    </div>
  </div>
  <hr class="divider"/>
  <table>
    <thead>
      <tr>
        <th>#</th>
        <th>Medicine</th>
        <th>Qty</th>
        <th>Rate</th>
        <th>GST%</th>
        <th>GST Amt</th>
        <th>Total</th>
      </tr>
    </thead>
    <tbody>
      ${itemRows}
    </tbody>
  </table>
  <div class="totals">
    <table>
      <tr><td>Subtotal (taxable)</td><td style="text-align:right">₹${bill.subtotal.toFixed(2)}</td></tr>
      <tr><td>GST Total</td><td style="text-align:right">₹${bill.gst_total.toFixed(2)}</td></tr>
      ${bill.discount_total > 0 ? `<tr><td>Discount</td><td style="text-align:right">- ₹${bill.discount_total.toFixed(2)}</td></tr>` : ''}
      <tr class="grand"><td><strong>Grand Total</strong></td><td style="text-align:right"><strong>₹${bill.grand_total.toFixed(2)}</strong></td></tr>
    </table>
  </div>
  <div class="footer">
    <p>Thank you for visiting ${settings.store_name}!</p>
    <p>This is a computer-generated invoice.</p>
  </div>
</body>
</html>`;
}
