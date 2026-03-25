import { NextRequest, NextResponse } from 'next/server';
import { getSession, verifyCredentials } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const { username, password } = await req.json();

  if (!verifyCredentials(username, password)) {
    return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 });
  }

  const session = await getSession();
  session.username = username;
  session.isLoggedIn = true;
  await session.save();

  return NextResponse.json({ ok: true });
}
