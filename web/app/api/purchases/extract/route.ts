import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';

// ── Types ──────────────────────────────────────────────────────────────────────

export interface ExtractedPOItem {
  medicine_name: string;
  hsn: string;
  batch_no: string;
  expiry_month: number | null;
  expiry_year: number | null;
  packing: string;
  pack_qty: number;
  qty: number;
  deal_qty: number;
  rate: number;
  discount: number;
  gst_percent: string;
  mrp: number;
  manufacture_name: string;
}

export interface ExtractedPO {
  supplier: {
    supplier_name: string;
    supplier_invoice_no: string;
    supplier_gstin: string;
    supplier_address: string;
    supplier_phone: string;
    supplier_drug_license: string;
  };
  items: ExtractedPOItem[];
}

// ── Supported MIME types ───────────────────────────────────────────────────────

const IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

// ── Prompts ───────────────────────────────────────────────────────────────────

const SYSTEM_PROMPT =
  'You are an expert OCR and data extraction assistant for Indian pharmacy documents. ' +
  'You always respond with valid JSON only — no markdown fences, no explanation, no extra text.';

const USER_PROMPT = `Extract all information from this Indian pharmacy GST invoice / purchase order / delivery challan and return a JSON object with EXACTLY this structure:

{
  "supplier": {
    "supplier_name": "Name of the SELLER/DISTRIBUTOR (the company issuing the invoice, shown prominently at top)",
    "supplier_invoice_no": "Invoice number or serial number on the document",
    "supplier_gstin": "GSTIN of the seller (15-character alphanumeric)",
    "supplier_address": "Full address of the seller",
    "supplier_phone": "Phone/mobile of the seller",
    "supplier_drug_license": "Drug license number of the seller, or empty string"
  },
  "items": [
    {
      "medicine_name": "Exact product name as printed, with strength e.g. DOLO 650MG TAB",
      "hsn": "Value from HSN column, or empty string",
      "batch_no": "Value from Batch No column",
      "expiry_month": <integer 1-12 from expiry date, null if absent>,
      "expiry_year": <4-digit year e.g. 2027, null if absent>,
      "packing": "Pack size as printed e.g. #10, 10x10, Strip of 10",
      "pack_qty": <units per pack as integer, default 1>,
      "qty": <number from Qty column as integer>,
      "deal_qty": <free/bonus qty from Deal column as integer, default 0>,
      "rate": <value from Rate column as decimal>,
      "discount": <value from Disc/Discount column as decimal, default 0>,
      "gst_percent": "total GST as string — CGST%+SGST%, e.g. 2.5+2.5 = '5'",
      "mrp": <value from MRP/M.R.P column as decimal>,
      "manufacture_name": "Value from Mfg/Manufacturer column, or empty string"
    }
  ]
}

Critical rules:
- The SELLER (large header text at top of invoice) is the supplier. The BUYER/STOCKIST/CONSIGNEE is NOT the supplier.
- Read EVERY numbered row in the items table. Do NOT skip rows. Do NOT add rows not in the table.
- The total item count is usually printed at the bottom — verify your row count matches it.
- Expiry format MM/YY: convert 2-digit year to 4-digit (27→2027, 28→2028, 26→2026).
- The document may be rotated or landscape — read it in whatever orientation the text appears correctly.
- Monetary values: plain decimal numbers, no ₹ symbol.
- CGST + SGST columns: add together to get gst_percent (e.g. each 2.50 → "5").
- Missing fields: "" for strings, 0 for numbers, null for expiry_month/expiry_year.
- Return ONLY the JSON object.`;

// ── Handler ───────────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey || apiKey === 'your-groq-api-key-here') {
    return NextResponse.json(
      { error: 'GROQ_API_KEY is not configured in .env.local. Get a free key at console.groq.com.' },
      { status: 503 }
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    if (file.size > 20 * 1024 * 1024) return NextResponse.json({ error: 'File must be under 20 MB' }, { status: 400 });

    const mimeType = file.type;
    const buffer = Buffer.from(await file.arrayBuffer());

    const client = new Groq({ apiKey });
    let rawText = '';

    if (mimeType === 'application/pdf') {
      const pdfParse = (await import('pdf-parse')).default;
      const parsed = await pdfParse(buffer);
      const pdfText = parsed.text?.trim();

      if (!pdfText) {
        return NextResponse.json(
          { error: 'Could not extract text from the PDF. Please upload it as an image instead.' },
          { status: 422 }
        );
      }

      const completion = await client.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        max_tokens: 4096,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: `${USER_PROMPT}\n\nDocument text:\n\`\`\`\n${pdfText}\n\`\`\`` },
        ],
      });

      rawText = completion.choices[0]?.message?.content?.trim() ?? '';

    } else if (IMAGE_TYPES.includes(mimeType)) {
      const sharp = (await import('sharp')).default;
      const processed = await sharp(buffer)
        .rotate()
        .resize({ width: 2048, withoutEnlargement: true })
        .jpeg({ quality: 90 })
        .toBuffer();
      const base64 = processed.toString('base64');

      const completion = await client.chat.completions.create({
        model: 'meta-llama/llama-4-scout-17b-16e-instruct',
        max_tokens: 4096,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          {
            role: 'user',
            content: [
              { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${base64}` } },
              { type: 'text', text: USER_PROMPT },
            ],
          },
        ],
      });

      rawText = completion.choices[0]?.message?.content?.trim() ?? '';

    } else {
      return NextResponse.json(
        { error: 'Unsupported file type. Please upload a JPEG, PNG, WebP image or a PDF.' },
        { status: 400 }
      );
    }

    const start = rawText.indexOf('{');
    const end = rawText.lastIndexOf('}');
    const jsonText = start !== -1 && end > start ? rawText.slice(start, end + 1) : rawText;

    let extracted: ExtractedPO;
    try {
      extracted = JSON.parse(jsonText);
    } catch {
      console.error('[extract] Non-JSON response:\n', rawText);
      return NextResponse.json(
        { error: 'AI could not produce a valid result. Try a clearer image.' },
        { status: 422 }
      );
    }

    return NextResponse.json(extracted);
  } catch (err: any) {
    console.error('[extract] Error:', err?.message ?? err);
    return NextResponse.json(
      { error: err?.message ?? 'Extraction failed' },
      { status: 500 }
    );
  }
}
