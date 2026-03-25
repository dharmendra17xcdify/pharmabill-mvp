import { NextResponse } from 'next/server';
import { getBillById, deleteBill } from '@/lib/billRepo';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const bill = await getBillById(Number(id));
    if (!bill) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(bill);
  } catch (err) {
    console.error('GET /api/bills/[id]', err);
    return NextResponse.json({ error: 'Failed to load bill' }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await deleteBill(Number(id));
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('DELETE /api/bills/[id]', err);
    return NextResponse.json({ error: 'Failed to delete bill' }, { status: 500 });
  }
}
