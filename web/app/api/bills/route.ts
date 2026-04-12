import { NextResponse } from 'next/server';
import { getAllBills, saveBill, getNextInvoiceNumber } from '@/lib/billRepo';
import { getSettings } from '@/lib/settingsRepo';
import { nowISO } from '@/utils/date';

export async function GET() {
  try {
    const bills = await getAllBills();
    return NextResponse.json(bills);
  } catch (err) {
    console.error('GET /api/bills', err);
    return NextResponse.json({ error: 'Failed to load bills' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { bill, items } = await request.json();
    const settings = await getSettings();
    const prefix = settings?.invoice_prefix ?? 'MED';
    const bill_number = await getNextInvoiceNumber(prefix);
    // Combine chosen date with current time so the timestamp is accurate
    const created_at = bill.bill_date
      ? (() => {
          const now = new Date();
          const [y, m, d] = bill.bill_date.split('-').map(Number);
          now.setFullYear(y, m - 1, d);
          return now.toISOString();
        })()
      : nowISO();
    const billId = await saveBill(
      { ...bill, bill_number, created_at },
      items
    );
    return NextResponse.json({ id: billId, bill_number }, { status: 201 });
  } catch (err) {
    console.error('POST /api/bills', err);
    return NextResponse.json({ error: 'Failed to save bill' }, { status: 500 });
  }
}
