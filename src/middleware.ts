// Middleware intentionally minimal — admin auth is handled client-side in admin layout
// This prevents cookie/domain issues with Privy across different hosting setups

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  // Let all requests through — auth is handled in the admin layout component
  return NextResponse.next();
}

export const config = {
  matcher: [],
};
