import { NextResponse } from 'next/server';
import { getMedicineById, updateMedicine, deleteMedicine } from '@/lib/medicineRepo';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const medicine = await getMedicineById(Number(id));
    if (!medicine) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(medicine);
  } catch (err) {
    console.error('GET /api/medicines/[id]', err);
    return NextResponse.json({ error: 'Failed to load medicine' }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    await updateMedicine({ ...body, id: Number(id) });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('PUT /api/medicines/[id]', err);
    return NextResponse.json({ error: 'Failed to update medicine' }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await deleteMedicine(Number(id));
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('DELETE /api/medicines/[id]', err);
    return NextResponse.json({ error: 'Failed to delete medicine' }, { status: 500 });
  }
}
