import { NextResponse } from 'next/server';
import { getAllMedicines, insertMedicine, searchMedicines } from '@/lib/medicineRepo';

function getErrorDetails(err: unknown) {
  if (err instanceof Error) {
    return {
      name: err.name,
      message: err.message,
      stack: err.stack,
    };
  }

  return {
    thrown: err,
  };
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q');
    const medicines = q ? await searchMedicines(q) : await getAllMedicines();
    return NextResponse.json(medicines);
  } catch (err) {
    console.error('GET /api/medicines failed', getErrorDetails(err));
    return NextResponse.json({ error: 'Failed to load medicines' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const id = await insertMedicine(body);
    return NextResponse.json({ id }, { status: 201 });
  } catch (err) {
    console.error('POST /api/medicines failed', getErrorDetails(err));
    return NextResponse.json({ error: 'Failed to insert medicine' }, { status: 500 });
  }
}
