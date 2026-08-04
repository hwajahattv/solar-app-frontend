/**
 * Password gate for inverter settings (controls). Uses the same signed-token
 * pattern as the dashboard PIN gate — see pin-gate.ts.
 */
import {
  buildGateCookie,
  clearGateCookie,
  createGateToken,
  readCookie,
  readEnv,
  timingSafeEqualString,
  verifyGateToken,
} from './pin-gate';

export const CONTROLS_COOKIE = 'knox_controls';
export const CONTROLS_MAX_AGE_SECONDS = 60 * 60 * 4; // 4 hours

export function getConfiguredControlsPassword(): string {
  return readEnv('CONTROLS_PASSWORD');
}

export function getControlsSecret(): string {
  const explicit = readEnv('CONTROLS_SECRET');
  if (explicit) return explicit;
  const password = getConfiguredControlsPassword();
  return password ? `knox-controls-fallback:${password}` : '';
}

export function buildControlsCookie(token: string): string {
  return buildGateCookie(token, CONTROLS_MAX_AGE_SECONDS, CONTROLS_COOKIE);
}

export function clearControlsCookie(): string {
  return `${CONTROLS_COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
}

export async function verifyControlsAccess(cookieHeader: string | null): Promise<boolean> {
  const password = getConfiguredControlsPassword();
  const secret = getControlsSecret();
  if (!password || !secret) return false;

  const token = readCookie(cookieHeader, CONTROLS_COOKIE);
  return verifyGateToken(token, secret);
}

export {
  createGateToken,
  timingSafeEqualString,
  verifyGateToken,
};
