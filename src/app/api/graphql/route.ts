import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/relay/server';
import { checkRateLimit } from '@/lib/rate-limit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ALLOWED_ORIGIN = process.env.NEXT_PUBLIC_WEBSITE_URL || 'http://localhost:3000';
const corsHeaders = {
  'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    const { allowed } = checkRateLimit(`graphql:${ip}`, 100, 60000);
    if (!allowed) {
      return NextResponse.json(
        { errors: [{ message: 'Too many requests' }] },
        { status: 429, headers: { ...corsHeaders, 'Retry-After': '60' } }
      );
    }

    const { query, variables } = await request.json();
    if (!query) return NextResponse.json({ error: 'Query is required' }, { status: 400 });

    if (process.env.NODE_ENV === 'production') {
      const queryStr = typeof query === 'string' ? query : '';
      if (queryStr.includes('__schema') || /\b__type\b/.test(queryStr)) {
        return NextResponse.json({ errors: [{ message: 'Introspection is disabled' }] }, { status: 403, headers: corsHeaders });
      }
    }

    const data = await Promise.race([
      executeQuery(query, variables || {}, request),
      new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 25000))
    ]);

    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: corsHeaders });
}
