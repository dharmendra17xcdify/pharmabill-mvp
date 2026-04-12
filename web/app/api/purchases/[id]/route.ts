import { NextResponse } from 'next/server';
import { getPurchaseById, updatePurchase } from '@/lib/purchaseRepo';

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

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { purchase, items } = await req.json();
    await updatePurchase(Number(id), purchase, items);
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error('PUT /api/purchases/[id]', err);
    return NextResponse.json({ error: err?.message ?? 'Failed to update purchase' }, { status: 500 });
  }
}
