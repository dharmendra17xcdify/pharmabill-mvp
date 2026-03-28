import { NextResponse } from 'next/server';
import { getSupplierReturnById } from '@/lib/supplierReturnRepo';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const ret = await getSupplierReturnById(Number(id));
    if (!ret) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(ret);
  } catch (err) {
    console.error('GET /api/supplier-returns/[id]', err);
    return NextResponse.json({ error: 'Failed to load supplier return' }, { status: 500 });
  }
}
