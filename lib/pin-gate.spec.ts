import { afterEach, describe, expect, it } from 'vitest';

import {
  buildGateCookie,
  clearGateCookie,
  createGateToken,
  GATE_COOKIE,
  getConfiguredPin,
  getPinSecret,
  readCookie,
  timingSafeEqualString,
  verifyGateToken,
} from './pin-gate';

describe('pin-gate', () => {
  const previousPin = process.env.APP_PIN;
  const previousSecret = process.env.PIN_SECRET;

  afterEach(() => {
    if (previousPin === undefined) delete process.env.APP_PIN;
    else process.env.APP_PIN = previousPin;
    if (previousSecret === undefined) delete process.env.PIN_SECRET;
    else process.env.PIN_SECRET = previousSecret;
  });

  it('compares PIN strings in constant-time fashion', () => {
    expect(timingSafeEqualString('123456', '123456')).toBe(true);
    expect(timingSafeEqualString('123456', '123457')).toBe(false);
    expect(timingSafeEqualString('123', '1234')).toBe(false);
  });

  it('reads APP_PIN and PIN_SECRET from the environment', () => {
    process.env.APP_PIN = '654321';
    process.env.PIN_SECRET = 'unit-test-secret';
    expect(getConfiguredPin()).toBe('654321');
    expect(getPinSecret()).toBe('unit-test-secret');
  });

  it('falls back to a derived secret when PIN_SECRET is unset', () => {
    process.env.APP_PIN = '654321';
    delete process.env.PIN_SECRET;
    expect(getPinSecret()).toBe('knox-pin-fallback:654321');
  });

  it('creates and verifies a signed gate token', async () => {
    const secret = 'unit-test-secret';
    const token = await createGateToken(secret, 60);
    expect(await verifyGateToken(token, secret)).toBe(true);
    expect(await verifyGateToken(token, 'other-secret')).toBe(false);
    expect(await verifyGateToken('not-a-token', secret)).toBe(false);
    expect(await verifyGateToken(undefined, secret)).toBe(false);
  });

  it('rejects expired tokens', async () => {
    const secret = 'unit-test-secret';
    const token = await createGateToken(secret, -10);
    expect(await verifyGateToken(token, secret)).toBe(false);
  });

  it('builds and clears the gate cookie', () => {
    const cookie = buildGateCookie('abc.def');
    expect(cookie).toContain(`${GATE_COOKIE}=abc.def`);
    expect(cookie).toContain('HttpOnly');
    expect(cookie).toContain('Secure');
    expect(clearGateCookie()).toContain('Max-Age=0');
  });

  it('parses cookies from a header', () => {
    expect(readCookie('a=1; knox_gate=token.value; b=2', GATE_COOKIE)).toBe('token.value');
    expect(readCookie(null, GATE_COOKIE)).toBeUndefined();
  });
});
