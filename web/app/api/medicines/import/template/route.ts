import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';

export async function GET() {
  const headers = [
    'name', 'generic_name', 'manufacture_name', 'category', 'hsn',
    'packing', 'packing_qty', 'gst_percent',
    'batch_no', 'expiry_month', 'expiry_year',
    'mrp', 'selling_price', 'rate', 'discount', 'stock_qty',
  ];

  const sample = [
    ['Paracetamol 500mg', 'Acetaminophen', 'Cipla Ltd', 'Medicine', '30049099',
     'Strip of 10', 10, 12,
     'A001', 6, 2027,
     12.00, 10.00, 7.50, 0, 100],
    ['Hand Sanitizer 100ml', '', 'Dettol', 'General', '',
     'Bottle', 1, 18,
     '', '', '',
     60.00, 55.00, 40.00, 0, 50],
  ];

  const ws = XLSX.utils.aoa_to_sheet([headers, ...sample]);

  // Column widths
  ws['!cols'] = headers.map(h => ({ wch: Math.max(h.length + 4, 16) }));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Items');

  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

  return new NextResponse(buf, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="medicine_import_template.xlsx"',
    },
  });
}
