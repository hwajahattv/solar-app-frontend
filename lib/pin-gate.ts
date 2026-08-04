/**
 * Shared PIN-gate helpers for Vercel Edge middleware and /api/pin/* routes.
 * Pure Web Crypto — no Node-only APIs — so Edge and Vitest can both use it.
 */

export const GATE_COOKIE = 'knox_gate';
export const GATE_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

const encoder = new TextEncoder();

/** Edge-safe env read — avoids depending on Node typings in the Angular tsconfig. */
export function readEnv(name: string): string {
  const runtime = globalThis as typeof globalThis & {
    process?: { env?: Record<string, string | undefined> };
  };
  return (runtime.process?.env?.[name] ?? '').trim();
}

export function getConfiguredPin(): string {
  return readEnv('APP_PIN');
}

export function getPinSecret(): string {
  const explicit = readEnv('PIN_SECRET');
  if (explicit) return explicit;
  const pin = getConfiguredPin();
  // Fallback keeps local/preview usable; production should set PIN_SECRET.
  return pin ? `knox-pin-fallback:${pin}` : '';
}

/** Constant-time string compare for equal-length UTF-8 strings. */
export function timingSafeEqualString(a: string, b: string): boolean {
  const aBytes = encoder.encode(a);
  const bBytes = encoder.encode(b);
  if (aBytes.length !== bBytes.length) {
    // Still walk to reduce length-leaking shortcuts on mismatch.
    let diff = aBytes.length ^ bBytes.length;
    const len = Math.max(aBytes.length, bBytes.length);
    for (let i = 0; i < len; i++) {
      diff |= (aBytes[i] ?? 0) ^ (bBytes[i] ?? 0);
    }
    return diff === 0 && aBytes.length === bBytes.length;
  }
  let diff = 0;
  for (let i = 0; i < aBytes.length; i++) {
    diff |= aBytes[i]! ^ bBytes[i]!;
  }
  return diff === 0;
}

async function hmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify'],
  );
}

function toBase64Url(bytes: ArrayBuffer | Uint8Array): string {
  const view = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let binary = '';
  for (let i = 0; i < view.length; i++) {
    binary += String.fromCharCode(view[i]!);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

/** Create a signed gate token: `{exp}.{hmac}`. */
export async function createGateToken(secret: string, maxAgeSeconds = GATE_MAX_AGE_SECONDS): Promise<string> {
  const exp = Math.floor(Date.now() / 1000) + maxAgeSeconds;
  const payload = String(exp);
  const key = await hmacKey(secret);
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));
  return `${payload}.${toBase64Url(sig)}`;
}

/** Verify a signed gate token. */
export async function verifyGateToken(token: string | undefined | null, secret: string): Promise<boolean> {
  if (!token || !secret) return false;
  const parts = token.split('.');
  if (parts.length !== 2) return false;
  const [payload, sigB64] = parts;
  if (!payload || !sigB64) return false;

  const exp = Number(payload);
  if (!Number.isFinite(exp) || exp < Math.floor(Date.now() / 1000)) return false;

  const key = await hmacKey(secret);
  const expected = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));
  return timingSafeEqualString(toBase64Url(expected), sigB64);
}

export function buildGateCookie(
  token: string,
  maxAgeSeconds = GATE_MAX_AGE_SECONDS,
  cookieName = GATE_COOKIE,
): string {
  const parts = [
    `${cookieName}=${token}`,
    'Path=/',
    'HttpOnly',
    'Secure',
    'SameSite=Lax',
    `Max-Age=${maxAgeSeconds}`,
  ];
  return parts.join('; ');
}

export function clearGateCookie(): string {
  return `${GATE_COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
}

export function readCookie(cookieHeader: string | null, name: string): string | undefined {
  if (!cookieHeader) return undefined;
  for (const part of cookieHeader.split(';')) {
    const [rawKey, ...rest] = part.trim().split('=');
    if (rawKey === name) return rest.join('=');
  }
  return undefined;
}
