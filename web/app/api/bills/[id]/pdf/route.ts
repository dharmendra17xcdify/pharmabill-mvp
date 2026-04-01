import { NextResponse } from 'next/server';
import puppeteer from 'puppeteer';
import { getBillById } from '@/lib/billRepo';
import { getSettings } from '@/lib/settingsRepo';
import { buildInvoiceHTML } from '@/utils/invoice';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const [bill, settings] = await Promise.all([
      getBillById(Number(id)),
      getSettings(),
    ]);

    if (!bill) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (!settings) return NextResponse.json({ error: 'Store settings not configured' }, { status: 500 });

    const html = buildInvoiceHTML(bill, bill.items ?? [], settings);

    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const pdf = await page.pdf({ format: 'A4', printBackground: true, margin: { top: '10mm', bottom: '10mm', left: '10mm', right: '10mm' } });
    await browser.close();

    return new NextResponse(Buffer.from(pdf), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${bill.bill_number}.pdf"`,
      },
    });
  } catch (err) {
    console.error('GET /api/bills/[id]/pdf', err);
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 });
  }
}
