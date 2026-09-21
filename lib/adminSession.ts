import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import type { NextRequest } from 'next/server';

export const ADMIN_COOKIE = 'liebe_admin';
export const SESSION_SECONDS = 8 * 60 * 60;

function config() {
  const username = process.env.ADMIN_USERNAME;
  const password = process.env.ADMIN_PASSWORD;
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!username || !password || password.length < 12 || !secret || secret.length < 32) {
    throw new Error('Isi ADMIN_USERNAME, ADMIN_PASSWORD (minimal 12 karakter), dan ADMIN_SESSION_SECRET (minimal 32 karakter) di environment server.');
  }
  return { username, password, secret };
}
function equal(a: string, b: string) {
  return timingSafeEqual(createHash('sha256').update(a).digest(), createHash('sha256').update(b).digest());
}
function signature(payload: string) {
  const { username, password, secret } = config();
  return createHmac('sha256', secret).update(JSON.stringify([payload, username, password])).digest('base64url');
}
export function credentialsMatch(username: string, password: string) {
  const configured = config();
  const userMatch = equal(username, configured.username);
  return equal(password, configured.password) && userMatch;
}
export function createSession() {
  const payload = `${Date.now() + SESSION_SECONDS * 1000}.${randomBytes(24).toString('base64url')}`;
  return `${payload}.${signature(payload)}`;
}
export function isAdmin(request: NextRequest) {
  try {
    const token = request.cookies.get(ADMIN_COOKIE)?.value || '';
    const parts = token.split('.');
    if (parts.length !== 3 || !/^\d+$/.test(parts[0])) return false;
    const expires = Number(parts[0]);
    if (expires <= Date.now() || expires > Date.now() + SESSION_SECONDS * 1000) return false;
    return equal(parts[2], signature(`${parts[0]}.${parts[1]}`));
  } catch { return false; }
}
export function sameOrigin(request: NextRequest) {
  return request.headers.get('origin') === request.nextUrl.origin;
}
export const cookieOptions = {
  httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict' as const, path: '/',
};