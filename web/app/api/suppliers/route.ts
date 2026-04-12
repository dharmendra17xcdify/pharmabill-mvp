import { NextResponse } from 'next/server';
import { getAllSuppliers, createSupplier } from '@/lib/supplierRepo';
import { nowISO } from '@/utils/date';

export async function GET() {
  try {
    const suppliers = await getAllSuppliers();
    return NextResponse.json(suppliers);
  } catch (err) {
    console.error('GET /api/suppliers', err);
    return NextResponse.json({ error: 'Failed to load suppliers' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const now = nowISO();
    const id = await createSupplier({ ...body, created_at: now, updated_at: now });
    return NextResponse.json({ id }, { status: 201 });
  } catch (err: any) {
    console.error('POST /api/suppliers', err);
    return NextResponse.json({ error: err?.message ?? 'Failed to save supplier' }, { status: 500 });
  }
}
