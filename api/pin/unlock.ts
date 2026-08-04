import {
  buildGateCookie,
  createGateToken,
  getConfiguredPin,
  getPinSecret,
  timingSafeEqualString,
} from '../../lib/pin-gate';

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
  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed' }, { status: 405 });
  }

  const expectedPin = getConfiguredPin();
  const secret = getPinSecret();
  if (!expectedPin || !secret) {
    return json({ error: 'PIN gate is not configured on this deployment' }, { status: 503 });
  }

  let pin = '';
  try {
    const contentType = request.headers.get('content-type') ?? '';
    if (contentType.includes('application/json')) {
      const body = (await request.json()) as { pin?: unknown };
      pin = typeof body.pin === 'string' ? body.pin : '';
    } else {
      const form = await request.formData();
      const value = form.get('pin');
      pin = typeof value === 'string' ? value : '';
    }
  } catch {
    return json({ error: 'Invalid request body' }, { status: 400 });
  }

  pin = pin.trim();
  if (!pin || !timingSafeEqualString(pin, expectedPin)) {
    return json({ error: 'Incorrect PIN' }, { status: 401 });
  }

  const token = await createGateToken(secret);
  return json(
    { ok: true },
    {
      status: 200,
      headers: {
        'Set-Cookie': buildGateCookie(token),
      },
    },
  );
}
