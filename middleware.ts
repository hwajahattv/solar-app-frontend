import { next } from '@vercel/edge';

import { verifyControlsAccess, getConfiguredControlsPassword, getControlsSecret } from './lib/controls-gate';
import {
  GATE_COOKIE,
  getConfiguredPin,
  getPinSecret,
  readCookie,
  readEnv,
  verifyGateToken,
} from './lib/pin-gate';

export const config = {
  matcher: ['/((?!api/pin/|api/controls/|_vercel/).*)'],
};

function isPublicPath(pathname: string): boolean {
  return (
    pathname === '/login.html' ||
    pathname === '/favicon.ico' ||
    pathname === '/robots.txt' ||
    pathname.startsWith('/api/pin/') ||
    pathname.startsWith('/api/controls/')
  );
}

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}

async function requireDashboardPin(request: Request): Promise<Response | null> {
  const pin = getConfiguredPin();
  const secret = getPinSecret();

  if (!pin || !secret) {
    if (readEnv('VERCEL_ENV') === 'production') {
      return new Response('PIN gate is not configured (set APP_PIN and PIN_SECRET).', {
        status: 503,
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      });
    }
    return null;
  }

  const token = readCookie(request.headers.get('cookie'), GATE_COOKIE);
  const valid = await verifyGateToken(token, secret);
  if (valid) return null;

  const url = new URL(request.url);
  url.pathname = '/login.html';
  url.search = '';
  return Response.redirect(url, 302);
}

async function requireControlsAccess(request: Request): Promise<Response | null> {
  const password = getConfiguredControlsPassword();
  const secret = getControlsSecret();
  if (!password || !secret) {
    if (readEnv('VERCEL_ENV') === 'production') {
      return json(
        {
          statusCode: 503,
          message: 'Controls password is not configured (set CONTROLS_PASSWORD).',
          error: 'Service Unavailable',
        },
        503,
      );
    }
    return null;
  }

  const valid = await verifyControlsAccess(request.headers.get('cookie'));
  if (valid) return null;

  return json(
    {
      statusCode: 401,
      message: 'Controls access required',
      error: 'Unauthorized',
    },
    401,
  );
}

/**
 * Soft gate: require a signed knox_gate cookie before serving the SPA.
 * Inverter settings API calls additionally require knox_controls.
 */
export default async function middleware(request: Request): Promise<Response> {
  const url = new URL(request.url);

  if (isPublicPath(url.pathname)) {
    return next();
  }

  const pinBlock = await requireDashboardPin(request);
  if (pinBlock) return pinBlock;

  if (url.pathname.startsWith('/api/v1/controls')) {
    const controlsBlock = await requireControlsAccess(request);
    if (controlsBlock) return controlsBlock;
  }

  return next();
}
