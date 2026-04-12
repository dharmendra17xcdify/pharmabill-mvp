import { NextResponse } from 'next/server';
import { getDbDebugInfo, getPool } from '@/lib/db';

export async function GET() {
  try {
    const pool = await getPool();
    const result = await pool.request().query('SELECT @@VERSION AS version, @@SERVERNAME AS server');
    return NextResponse.json({
      ok: true,
      server: result.recordset[0].server,
      version: result.recordset[0].version,
      dbConfig: getDbDebugInfo(),
    });
  } catch (err) {
    const details =
      err instanceof Error
        ? {
            name: err.name,
            message: err.message,
            stack: err.stack,
          }
        : {
            thrown: err,
          };

    return NextResponse.json(
      {
        ok: false,
        error: details,
        dbConfig: getDbDebugInfo(),
      },
      { status: 500 }
    );
  }
}
