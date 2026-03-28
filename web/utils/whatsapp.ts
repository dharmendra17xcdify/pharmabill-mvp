import { Bill, BillItem } from '@/types/bill';
import { StoreSettings } from '@/types/settings';
import { formatINR } from './currency';
import { formatDateShort } from './date';

export function buildWhatsAppMessage(
  bill: Bill,
  items: BillItem[],
  settings: StoreSettings
): string {
  const lines: string[] = [];

  lines.push(`*${settings.store_name}*`);
  if (settings.address) lines.push(settings.address);
  lines.push('');

  lines.push(`Bill No: *${bill.bill_number}*`);
  lines.push(`Date: ${formatDateShort(bill.created_at)}`);
  if (bill.customer_name) lines.push(`Customer: ${bill.customer_name}`);
  if (bill.customer_address) lines.push(`Address: ${bill.customer_address}`);
  if (bill.doctor_name) lines.push(`Doctor: ${bill.doctor_name}`);
  lines.push('');

  lines.push('*Items:*');
  for (const item of items) {
    lines.push(`• ${item.medicine_name} × ${item.qty} = ${formatINR(Number(item.line_total))}`);
  }
  lines.push('');

  if (Number(bill.discount_total) > 0) {
    lines.push(`Subtotal: ${formatINR(Number(bill.subtotal))}`);
    lines.push(`GST: ${formatINR(Number(bill.gst_total))}`);
    const discPct = Number(bill.discount_percent) > 0 ? ` (${Number(bill.discount_percent)}%)` : '';
    lines.push(`Discount${discPct}: -${formatINR(Number(bill.discount_total))}`);
  }
  lines.push(`*Total: ${formatINR(Number(bill.grand_total))}*`);
  lines.push(`Payment: ${bill.payment_mode}`);
  lines.push('');
  lines.push('Thank you! 🙏');

  return lines.join('\n');
}

function toFullPhone(phone?: string): string {
  const digits = phone?.replace(/\D/g, '') ?? '';
  return digits.length === 10 ? `91${digits}` : digits;
}

export function getWhatsAppUrl(message: string, customerPhone?: string, storePhone?: string): string {
  const encoded = encodeURIComponent(message);
  const fullPhone = toFullPhone(customerPhone) || toFullPhone(storePhone);
  return fullPhone
    ? `https://wa.me/${fullPhone}?text=${encoded}`
    : `https://wa.me/?text=${encoded}`;
}
