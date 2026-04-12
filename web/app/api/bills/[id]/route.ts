import { NextResponse } from 'next/server';
import { getBillById, updateBill, deleteBill } from '@/lib/billRepo';

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

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { bill, items } = await req.json();
    // Combine chosen date with current time to avoid midnight UTC offset
    const created_at = bill.bill_date
      ? (() => {
          const now = new Date();
          const [y, m, d] = bill.bill_date.split('-').map(Number);
          now.setFullYear(y, m - 1, d);
          return now.toISOString();
        })()
      : undefined;
    await updateBill(Number(id), { ...bill, ...(created_at ? { created_at } : {}) }, items);
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error('PUT /api/bills/[id]', err);
    return NextResponse.json({ error: err?.message ?? 'Failed to update bill' }, { status: 500 });
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
