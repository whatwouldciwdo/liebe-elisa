import { NextRequest, NextResponse } from 'next/server';
import { ADMIN_COOKIE, SESSION_SECONDS, cookieOptions, createSession, credentialsMatch, isAdmin, sameOrigin } from '@/lib/adminSession';

export const runtime = 'nodejs';
// Instance-local brute-force protection. Use an upstream rate limit on multi-instance deployments.
let attempts = 0;
let windowEnd = 0;

export function GET(request: NextRequest) {
  return NextResponse.json({ authenticated: isAdmin(request) }, { headers: { 'Cache-Control': 'no-store' } });
}
export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) return NextResponse.json({ error: 'Origin tidak diizinkan.' }, { status: 403 });
  if (Date.now() >= windowEnd) { attempts = 0; windowEnd = Date.now() + 60_000; }
  if (++attempts > 10) return NextResponse.json({ error: 'Terlalu banyak percobaan. Tunggu satu menit.' }, { status: 429 });
  try {
    const text = await request.text();
    if (text.length > 4096) return NextResponse.json({ error: 'Permintaan terlalu besar.' }, { status: 413 });
    let body;
    try { body = JSON.parse(text); } catch { return NextResponse.json({ error: 'Format login tidak valid.' }, { status: 400 }); }
    if (typeof body?.username !== 'string' || typeof body?.password !== 'string' || !credentialsMatch(body.username, body.password)) {
      return NextResponse.json({ error: 'Username atau password salah.' }, { status: 401 });
    }
    const response = NextResponse.json({ authenticated: true });
    response.cookies.set(ADMIN_COOKIE, createSession(), { ...cookieOptions, maxAge: SESSION_SECONDS });
    response.headers.set('Cache-Control', 'no-store');
    return response;
  } catch {
    return NextResponse.json({ error: 'Login admin belum dikonfigurasi. Periksa ADMIN_USERNAME, ADMIN_PASSWORD (min. 12 karakter) dan ADMIN_SESSION_SECRET (min. 32 karakter) di server.' }, { status: 503 });
  }
}
export function DELETE(request: NextRequest) {
  if (!sameOrigin(request)) return NextResponse.json({ error: 'Origin tidak diizinkan.' }, { status: 403 });
  const response = NextResponse.json({ authenticated: false });
  response.cookies.set(ADMIN_COOKIE, '', { ...cookieOptions, maxAge: 0 });
  return response;
}