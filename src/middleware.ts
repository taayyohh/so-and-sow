import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const SESSION_COOKIE = 'sas-session';
const SESSION_TTL = 5 * 60 * 1000;

interface SessionData {
  isAuthenticated: boolean;
  role?: string;
  ts: number;
}

function getSessionFromCookie(request: NextRequest): SessionData | null {
  const raw = request.cookies.get(SESSION_COOKIE)?.value;
  if (!raw) return null;
  try {
    const data: SessionData = JSON.parse(raw);
    if (Date.now() - data.ts > SESSION_TTL) return null;
    return data;
  } catch {
    return null;
  }
}

async function verifyAuthToken(token: string, origin: string) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);
  try {
    const response = await fetch(`${origin}/api/auth/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    if (!response.ok) return { isAuthenticated: false };
    return await response.json();
  } catch {
    clearTimeout(timeoutId);
    return { isAuthenticated: false };
  }
}

export async function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith('/api/auth/') ||
      request.nextUrl.pathname.startsWith('/api/webhooks/')) {
    return NextResponse.next();
  }

  const authToken = request.cookies.get('privy-token')?.value;
  const cached = getSessionFromCookie(request);

  if (request.nextUrl.pathname.startsWith('/admin')) {
    if (!authToken) {
      return NextResponse.redirect(new URL('/', request.url));
    }

    if (cached) {
      if (!cached.isAuthenticated || cached.role !== 'ADMIN') {
        return NextResponse.redirect(new URL('/', request.url));
      }
      return NextResponse.next();
    }

    try {
      const user = await verifyAuthToken(authToken, request.nextUrl.origin);
      const session: SessionData = { isAuthenticated: user.isAuthenticated, role: user.role, ts: Date.now() };

      if (!user.isAuthenticated || user.role !== 'ADMIN') {
        return NextResponse.redirect(new URL('/', request.url));
      }

      const response = NextResponse.next();
      response.cookies.set(SESSION_COOKIE, JSON.stringify(session), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 300,
        path: '/',
      });
      return response;
    } catch {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
