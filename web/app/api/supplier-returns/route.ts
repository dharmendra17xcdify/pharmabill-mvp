import { NextResponse } from 'next/server';
import { getAllSupplierReturns, getNextReturnNumber, saveSupplierReturn } from '@/lib/supplierReturnRepo';
import { nowISO } from '@/utils/date';

export async function GET() {
  try {
    const returns = await getAllSupplierReturns();
    return NextResponse.json(returns);
  } catch (err) {
    console.error('GET /api/supplier-returns', err);
    return NextResponse.json({ error: 'Failed to load supplier returns' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { ret, items } = await request.json();
    const return_number = await getNextReturnNumber();
    const id = await saveSupplierReturn(
      { ...ret, return_number, created_at: nowISO() },
      items
    );
    return NextResponse.json({ id, return_number }, { status: 201 });
  } catch (err) {
    console.error('POST /api/supplier-returns', err);
    return NextResponse.json({ error: 'Failed to save supplier return' }, { status: 500 });
  }
}
