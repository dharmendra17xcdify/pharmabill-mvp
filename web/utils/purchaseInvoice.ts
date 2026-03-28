import { Purchase, PurchaseItem } from '@/types/purchase';
import { StoreSettings } from '@/types/settings';
import { formatDate } from './date';

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

export function buildPurchaseInvoiceHTML(
  purchase: Purchase & { items: PurchaseItem[] },
  settings: StoreSettings
): string {
  const totalQty = purchase.items.reduce((s, it) => s + Number(it.qty), 0);
  const totalDeal = purchase.items.reduce((s, it) => s + Number(it.deal_qty), 0);

  const itemRows = purchase.items
    .map(
      (item, i) => `
    <tr>
      <td style="text-align:center">${i + 1}</td>
      <td>
        <strong>${item.medicine_name}</strong>
        ${item.batch_no ? `<br/><small style="color:#555">Batch: ${item.batch_no}</small>` : ''}
      </td>
      <td style="text-align:center">${item.expiry_month && item.expiry_year ? `${String(item.expiry_month).padStart(2, '0')}/${item.expiry_year}` : ''}</td>
      <td style="text-align:center">${item.packing || ''}</td>
      <td style="text-align:center">${item.qty}</td>
      <td style="text-align:center">${item.deal_qty || 0}</td>
      <td style="text-align:right">₹${Number(item.rate).toFixed(2)}</td>
      <td style="text-align:center">${Number(item.discount).toFixed(2)}%</td>
      <td style="text-align:center">${Number(item.cgst_percent).toFixed(2)}%</td>
      <td style="text-align:center">${Number(item.sgst_percent).toFixed(2)}%</td>
      <td style="text-align:right">₹${Number(item.amount).toFixed(2)}</td>
      <td style="text-align:right">₹${Number(item.mrp).toFixed(2)}</td>
      <td>${item.manufacture_name || ''}</td>
    </tr>`
    )
    .join('');

  const gstinLine = settings.gstin ? `<p>GSTIN: ${settings.gstin}</p>` : '';
  const licLine = settings.drug_license ? `<p>Drug License: ${settings.drug_license}</p>` : '';

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>Purchase Order ${purchase.purchase_number}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, sans-serif; font-size: 12px; color: #222; padding: 20px; }
    .header { text-align: center; margin-bottom: 12px; }
    .header h1 { font-size: 20px; color: #1565C0; letter-spacing: 1px; font-weight: bold; }
    .header p { font-size: 11px; color: #555; margin-top: 2px; }
    .divider { border: none; border-top: 1px dashed #aaa; margin: 8px 0; }
    .bill-meta { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 11px; }
    .bill-meta div { line-height: 1.6; }
    table { width: 100%; border-collapse: collapse; margin: 10px 0; font-size: 11px; }
    th { background: #1565C0; color: white; padding: 5px 3px; font-size: 10px; text-align: left; border: 1px solid #1565C0; }
    td { padding: 4px 3px; border: 1px solid #ddd; vertical-align: top; }
    tr:nth-child(even) td { background: #F5F5F5; }
    .totals-section { display: flex; justify-content: flex-end; margin-top: 8px; }
    .totals-table { min-width: 260px; border-collapse: collapse; font-size: 12px; }
    .totals-table td { border: 1px solid #ddd; padding: 4px 8px; }
    .totals-table .grand { font-size: 13px; font-weight: bold; color: #1565C0; background: #E3F2FD; }
    .amount-words { margin-top: 10px; font-size: 11px; font-style: italic; border: 1px solid #ddd; padding: 6px 10px; background: #FAFAFA; }
    .signature-row { display: flex; justify-content: flex-end; align-items: flex-end; margin-top: 40px; padding-top: 8px; }
    .signature-box { text-align: center; }
    .signature-line { border-top: 1px solid #555; width: 160px; margin: 0 auto 4px; }
    .signature-label { font-size: 11px; color: #444; }
    .footer { clear: both; margin-top: 14px; text-align: center; font-size: 10px; color: #888; }
    @page { margin: 1cm; }
    @media print { body { padding: 0; } }
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
      <strong>Purchase No:</strong> ${purchase.purchase_number}<br/>
      <strong>Date:</strong> ${formatDate(purchase.created_at)}<br/>
      <strong>Payment:</strong> ${purchase.payment_mode}
    </div>
    <div style="text-align:right">
      <strong>Supplier:</strong> ${purchase.supplier_name || '—'}<br/>
      <strong>Invoice No:</strong> ${purchase.supplier_invoice_no || '—'}<br/>
      ${purchase.supplier_gstin ? `<strong>GSTIN:</strong> ${purchase.supplier_gstin}<br/>` : ''}
      ${purchase.supplier_phone ? `<strong>Tel:</strong> ${purchase.supplier_phone}<br/>` : ''}
      ${purchase.supplier_drug_license ? `<strong>Drug License:</strong> ${purchase.supplier_drug_license}<br/>` : ''}
      ${purchase.supplier_address ? `<span style="font-size:10px;color:#555">${purchase.supplier_address}</span>` : ''}
    </div>
  </div>
  <hr class="divider"/>
  <table>
    <thead>
      <tr>
        <th style="text-align:center;width:26px">S.No</th>
        <th style="min-width:110px">Particular</th>
        <th style="text-align:center;width:58px">Expiry</th>
        <th style="text-align:center;width:50px">Pack</th>
        <th style="text-align:center;width:34px">Qty</th>
        <th style="text-align:center;width:34px">Deal</th>
        <th style="text-align:right;width:60px">Rate</th>
        <th style="text-align:center;width:44px">Disc%</th>
        <th style="text-align:center;width:44px">CGST%</th>
        <th style="text-align:center;width:44px">SGST%</th>
        <th style="text-align:right;width:68px">Amount</th>
        <th style="text-align:right;width:60px">MRP</th>
        <th style="min-width:80px">Mfg</th>
      </tr>
    </thead>
    <tbody>${itemRows}</tbody>
    <tfoot>
      <tr style="background:#EEF2FF;font-weight:bold">
        <td colspan="4" style="text-align:right;padding:4px 8px">
          Total Items: ${purchase.items.length}
        </td>
        <td style="text-align:center">${totalQty}</td>
        <td style="text-align:center">${totalDeal}</td>
        <td colspan="4"></td>
        <td style="text-align:right">₹${Number(purchase.grand_total).toFixed(2)}</td>
        <td colspan="2"></td>
      </tr>
    </tfoot>
  </table>
  <div class="totals-section">
    <table class="totals-table">
      <tr><td>Subtotal (Taxable)</td><td style="text-align:right">₹${Number(purchase.subtotal).toFixed(2)}</td></tr>
      <tr><td>CGST Total</td><td style="text-align:right">₹${Number(purchase.cgst_total).toFixed(2)}</td></tr>
      <tr><td>SGST Total</td><td style="text-align:right">₹${Number(purchase.sgst_total).toFixed(2)}</td></tr>
      ${Number(purchase.discount_total) > 0 ? `<tr><td>Discount</td><td style="text-align:right">- ₹${Number(purchase.discount_total).toFixed(2)}</td></tr>` : ''}
      <tr class="grand"><td><strong>Grand Total</strong></td><td style="text-align:right"><strong>₹${Number(purchase.grand_total).toFixed(2)}</strong></td></tr>
    </table>
  </div>
  <div class="amount-words">
    <strong>Amount in Words:</strong> ${numberToWords(Number(purchase.grand_total))}
  </div>
  <div class="signature-row">
    <div class="signature-box">
      <div class="signature-line"></div>
      <div class="signature-label"><strong>Authorized Signatory</strong></div>
      <div class="signature-label">${settings.store_name}</div>
    </div>
  </div>
  <div class="footer">
    <p>This is a computer-generated Purchase Order / GRN.</p>
  </div>
</body>
</html>`;
}
