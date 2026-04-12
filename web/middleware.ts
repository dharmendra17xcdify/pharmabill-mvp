import { NextRequest, NextResponse } from 'next/server';
import { unsealData } from 'iron-session';
import type { SessionData } from '@/lib/auth';

const PUBLIC_PATHS = ['/login', '/api/auth/login', '/api/settings'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const cookieValue = request.cookies.get('pharmabill_session')?.value;

  if (!cookieValue) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  try {
    const session = await unsealData<SessionData>(cookieValue, {
      password: process.env.SESSION_SECRET as string,
    });
    if (!session.isLoggedIn) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  } catch {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
