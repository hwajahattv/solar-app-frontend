import {
  buildControlsCookie,
  CONTROLS_MAX_AGE_SECONDS,
  createGateToken,
  getConfiguredControlsPassword,
  getControlsSecret,
  timingSafeEqualString,
} from '../../lib/controls-gate';

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

  const expected = getConfiguredControlsPassword();
  const secret = getControlsSecret();
  if (!expected || !secret) {
    return json({ error: 'Controls password is not configured on this deployment' }, { status: 503 });
  }

  let password = '';
  try {
    const contentType = request.headers.get('content-type') ?? '';
    if (contentType.includes('application/json')) {
      const body = (await request.json()) as { password?: unknown };
      password = typeof body.password === 'string' ? body.password : '';
    } else {
      const form = await request.formData();
      const value = form.get('password');
      password = typeof value === 'string' ? value : '';
    }
  } catch {
    return json({ error: 'Invalid request body' }, { status: 400 });
  }

  password = password.trim();
  if (!password || !timingSafeEqualString(password, expected)) {
    return json({ error: 'Incorrect password' }, { status: 401 });
  }

  const token = await createGateToken(secret, CONTROLS_MAX_AGE_SECONDS);
  return json(
    { ok: true },
    {
      status: 200,
      headers: {
        'Set-Cookie': buildControlsCookie(token),
      },
    },
  );
}
