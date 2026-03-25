import * as Sharing from 'expo-sharing';
import { Linking } from 'react-native';
import { Bill, BillItem } from '../types/bill';
import { StoreSettings } from '../types/settings';
import { formatINR } from '../utils/currency';
import { formatDateShort } from '../utils/date';

export async function sharePDF(fileUri: string): Promise<void> {
  const available = await Sharing.isAvailableAsync();
  if (!available) {
    throw new Error('Sharing is not available on this device');
  }
  await Sharing.shareAsync(fileUri, {
    mimeType: 'application/pdf',
    dialogTitle: 'Share Bill',
    UTI: 'com.adobe.pdf',
  });
}

function buildWhatsAppMessage(
  bill: Bill & { items: BillItem[] },
  settings: StoreSettings
): string {
  const lines: string[] = [];

  lines.push(`*${settings.store_name}*`);
  if (settings.address) lines.push(settings.address);
  lines.push('');

  lines.push(`Bill No: *${bill.bill_number}*`);
  lines.push(`Date: ${formatDateShort(bill.created_at)}`);
  if (bill.customer_name) lines.push(`Customer: ${bill.customer_name}`);
  lines.push('');

  lines.push('*Items:*');
  for (const item of bill.items) {
    lines.push(`• ${item.medicine_name} × ${item.qty} = ${formatINR(item.line_total)}`);
  }
  lines.push('');

  if (bill.discount_total > 0) {
    lines.push(`Subtotal: ${formatINR(bill.subtotal)}`);
    lines.push(`GST: ${formatINR(bill.gst_total)}`);
    lines.push(`Discount: -${formatINR(bill.discount_total)}`);
  }
  lines.push(`*Total: ${formatINR(bill.grand_total)}*`);
  lines.push(`Payment: ${bill.payment_mode}`);
  lines.push('');
  lines.push('Thank you! 🙏');

  return lines.join('\n');
}

export async function shareOnWhatsApp(
  pdfUri: string,
  bill: Bill & { items: BillItem[] },
  settings: StoreSettings
): Promise<void> {
  const message = buildWhatsAppMessage(bill, settings);
  const encoded = encodeURIComponent(message);

  const digits = bill.customer_phone?.replace(/\D/g, '') ?? '';
  const fullPhone = digits.length === 10 ? `91${digits}` : digits;

  const url = fullPhone
    ? `whatsapp://send?phone=${fullPhone}&text=${encoded}`
    : `whatsapp://send?text=${encoded}`;

  const canOpen = await Linking.canOpenURL(url);
  if (canOpen) {
    await Linking.openURL(url);
  } else {
    // WhatsApp not installed — fall back to native share sheet
    await sharePDF(pdfUri);
  }
}
