import { NextResponse } from 'next/server';
import { getSettings, saveSettings } from '@/lib/settingsRepo';

export async function GET() {
  try {
    const settings = await getSettings();
    return NextResponse.json({ settings });
  } catch (err) {
    console.error('GET /api/settings', err);
    return NextResponse.json({ error: 'Failed to load settings' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    await saveSettings(body);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('POST /api/settings', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
