import { NextResponse } from 'next/server';
import { getPurchaseById } from '@/lib/purchaseRepo';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const purchase = await getPurchaseById(Number(id));
    if (!purchase) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(purchase);
  } catch (err) {
    console.error('GET /api/purchases/[id]', err);
    return NextResponse.json({ error: 'Failed to load purchase' }, { status: 500 });
  }
}
