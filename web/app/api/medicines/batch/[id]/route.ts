import { NextResponse } from 'next/server';
import { deleteBatch } from '@/lib/medicineRepo';

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await deleteBatch(Number(id));
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('DELETE /api/medicines/batch/[id]', err);
    return NextResponse.json({ error: 'Failed to delete batch' }, { status: 500 });
  }
}
