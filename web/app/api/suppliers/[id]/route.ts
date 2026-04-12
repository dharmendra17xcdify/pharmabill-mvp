import { NextResponse } from 'next/server';
import { getSupplierById, updateSupplier, deleteSupplier } from '@/lib/supplierRepo';
import { nowISO } from '@/utils/date';

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supplier = await getSupplierById(Number(id));
    if (!supplier) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(supplier);
  } catch (err) {
    console.error('GET /api/suppliers/[id]', err);
    return NextResponse.json({ error: 'Failed to load supplier' }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    await updateSupplier(Number(id), { ...body, updated_at: nowISO() });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('PUT /api/suppliers/[id]', err);
    return NextResponse.json({ error: err?.message ?? 'Failed to update supplier' }, { status: 500 });
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await deleteSupplier(Number(id));
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('DELETE /api/suppliers/[id]', err);
    return NextResponse.json({ error: 'Failed to delete supplier' }, { status: 500 });
  }
}
