import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { insertMedicine } from '@/lib/medicineRepo';

// Expected columns (case-insensitive, trimmed):
// name*, generic_name, manufacture_name, category/group, hsn, packing, packing_qty,
// gst_percent, batch_no, expiry_month, expiry_year,
// mrp, selling_price, rate, discount, stock_qty

function normalise(headers: string[]): Record<string, number> {
  const map: Record<string, number> = {};
  headers.forEach((h, i) => {
    map[h.trim().toLowerCase().replace(/[\s\/]+/g, '_')] = i;
  });
  return map;
}

function col(row: any[], map: Record<string, number>, ...keys: string[]): string {
  for (const k of keys) {
    if (map[k] !== undefined && row[map[k]] !== undefined && row[map[k]] !== null && row[map[k]] !== '') {
      return String(row[map[k]]).trim();
    }
  }
  return '';
}

function num(v: string, fallback = 0): number {
  const n = parseFloat(v);
  return isNaN(n) ? fallback : n;
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    if (!file) return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });

    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!['xlsx', 'xls', 'csv'].includes(ext ?? '')) {
      return NextResponse.json({ error: 'Unsupported file type. Use .xlsx, .xls or .csv' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

    if (rows.length < 2) {
      return NextResponse.json({ error: 'File has no data rows' }, { status: 400 });
    }

    const headers = rows[0].map(String);
    const map = normalise(headers);

    if (map['name'] === undefined) {
      return NextResponse.json({
        error: 'Missing required column "name". Make sure the first row has column headers.',
      }, { status: 400 });
    }

    let imported = 0;
    const errors: string[] = [];

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      const name = col(row, map, 'name');
      if (!name) continue; // skip blank rows

      try {
        await insertMedicine({
          name,
          generic_name:     col(row, map, 'generic_name', 'generic'),
          manufacture_name: col(row, map, 'manufacture_name', 'manufacturer', 'company'),
          group:            col(row, map, 'category', 'group'),
          hsn:              col(row, map, 'hsn', 'hsn_code'),
          packing:          col(row, map, 'packing'),
          packing_qty:      num(col(row, map, 'packing_qty', 'units_per_pack'), 1) || 1,
          gst_percent:      num(col(row, map, 'gst_percent', 'gst', 'gst%')),
          batch_no:         col(row, map, 'batch_no', 'batch'),
          expiry_month:     num(col(row, map, 'expiry_month', 'exp_month', 'exp_mm')) || null,
          expiry_year:      num(col(row, map, 'expiry_year', 'exp_year', 'exp_yyyy')) || null,
          mrp:              num(col(row, map, 'mrp')),
          selling_price:    num(col(row, map, 'selling_price', 'selling', 'sale_price')),
          rate:             num(col(row, map, 'rate', 'purchase_rate', 'cost')),
          discount:         num(col(row, map, 'discount', 'discount%')),
          stock_qty:        Math.round(num(col(row, map, 'stock_qty', 'stock', 'qty'))),
        });
        imported++;
      } catch (e: any) {
        errors.push(`Row ${i + 1} (${name}): ${e?.message ?? 'Unknown error'}`);
      }
    }

    return NextResponse.json({ imported, errors });
  } catch (err: any) {
    console.error('POST /api/medicines/import', err);
    return NextResponse.json({ error: err?.message ?? 'Import failed' }, { status: 500 });
  }
}
