import { NextResponse } from 'next/server';
import { getAllPurchases, getNextPurchaseNumber, savePurchase } from '@/lib/purchaseRepo';
import { nowISO } from '@/utils/date';

export async function GET() {
  try {
    const purchases = await getAllPurchases();
    return NextResponse.json(purchases);
  } catch (err) {
    console.error('GET /api/purchases', err);
    return NextResponse.json({ error: 'Failed to load purchases' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { purchase, items } = await request.json();
    const purchase_number = await getNextPurchaseNumber();
    const created_at = purchase.purchase_date
      ? new Date(purchase.purchase_date).toISOString()
      : nowISO();
    const id = await savePurchase(
      { ...purchase, purchase_number, created_at },
      items
    );
    return NextResponse.json({ id, purchase_number }, { status: 201 });
  } catch (err: any) {
    console.error('POST /api/purchases', err);
    return NextResponse.json({ error: err?.message ?? 'Failed to save purchase' }, { status: 500 });
  }
}
