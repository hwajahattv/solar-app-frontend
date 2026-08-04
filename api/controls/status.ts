import {
  getConfiguredControlsPassword,
  getControlsSecret,
  verifyControlsAccess,
} from '../../lib/controls-gate';
import { readEnv } from '../../lib/pin-gate';

export const config = {
  runtime: 'edge',
};

function json(body: unknown, init: ResponseInit = {}): Response {
  const headers = new Headers(init.headers);
  headers.set('Content-Type', 'application/json; charset=utf-8');
  headers.set('Cache-Control', 'no-store');
  return new Response(JSON.stringify(body), { ...init, headers });
}

export default async function handler(request: Request): Promise<Response> {
  if (request.method !== 'GET') {
    return json({ error: 'Method not allowed' }, { status: 405 });
  }

  const password = getConfiguredControlsPassword();
  const secret = getControlsSecret();

  if (!password || !secret) {
    if (readEnv('VERCEL_ENV') === 'production') {
      return json(
        { configured: false, unlocked: false, error: 'Controls password is not configured' },
        { status: 503 },
      );
    }
    return json({ configured: false, unlocked: true });
  }

  const unlocked = await verifyControlsAccess(request.headers.get('cookie'));
  return json({ configured: true, unlocked });
}
