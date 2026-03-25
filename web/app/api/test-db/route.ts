import { NextResponse } from 'next/server';
import { getPool } from '@/lib/db';

export async function GET() {
  try {
    const pool = await getPool();
    const result = await pool.request().query('SELECT @@VERSION AS version, @@SERVERNAME AS server');
    return NextResponse.json({
      ok: true,
      server: result.recordset[0].server,
      version: result.recordset[0].version,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
