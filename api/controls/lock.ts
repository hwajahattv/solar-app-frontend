import { clearControlsCookie } from '../../lib/controls-gate';

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

  return json(
    { ok: true },
    {
      status: 200,
      headers: {
        'Set-Cookie': clearControlsCookie(),
      },
    },
  );
}
