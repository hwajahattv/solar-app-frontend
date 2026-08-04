import { next } from '@vercel/edge';

import {
  GATE_COOKIE,
  getConfiguredPin,
  getPinSecret,
  readCookie,
  verifyGateToken,
} from './lib/pin-gate';

export const config = {
  matcher: ['/((?!api/pin/|_vercel/).*)'],
};

function isPublicPath(pathname: string): boolean {
  return (
    pathname === '/login.html' ||
    pathname === '/favicon.ico' ||
    pathname === '/robots.txt' ||
    pathname.startsWith('/api/pin/')
  );
}

/**
 * Soft gate: require a signed knox_gate cookie before serving the SPA.
 * When APP_PIN is unset (misconfigured deploy), fail closed to login.
 */
export default async function middleware(request: Request): Promise<Response> {
  const url = new URL(request.url);

  if (isPublicPath(url.pathname)) {
    return next();
  }

  const pin = getConfiguredPin();
  const secret = getPinSecret();

  // Local `vercel dev` without env: allow through so the SPA remains usable.
  // Production should always set APP_PIN.
  if (!pin || !secret) {
    if (process.env.VERCEL_ENV === 'production') {
      return new Response('PIN gate is not configured (set APP_PIN and PIN_SECRET).', {
        status: 503,
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      });
    }
    return next();
  }

  const token = readCookie(request.headers.get('cookie'), GATE_COOKIE);
  const valid = await verifyGateToken(token, secret);
  if (valid) {
    return next();
  }

  url.pathname = '/login.html';
  url.search = '';
  return Response.redirect(url, 302);
}
