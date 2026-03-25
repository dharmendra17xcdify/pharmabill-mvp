import * as Print from 'expo-print';
import * as FileSystem from 'expo-file-system';
import { Bill, BillItem } from '../types/bill';
import { StoreSettings } from '../types/settings';
import { buildInvoiceHTML } from '../utils/invoice';

export async function generatePDF(
  bill: Bill,
  items: BillItem[],
  settings: StoreSettings
): Promise<string> {
  const html = buildInvoiceHTML(bill, items, settings);
  const { uri } = await Print.printToFileAsync({ html, base64: false });

  // Move to a named file in cache directory
  const fileName = `${bill.bill_number.replace('-', '_')}.pdf`;
  const destUri = `${FileSystem.cacheDirectory}${fileName}`;
  await FileSystem.moveAsync({ from: uri, to: destUri });

  return destUri;
}
