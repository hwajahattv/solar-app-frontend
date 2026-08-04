import { afterEach, describe, expect, it } from 'vitest';

import {
  buildControlsCookie,
  clearControlsCookie,
  CONTROLS_COOKIE,
  getConfiguredControlsPassword,
  getControlsSecret,
  verifyControlsAccess,
} from './controls-gate';
import { createGateToken } from './pin-gate';

describe('controls-gate', () => {
  const previousPassword = process.env['CONTROLS_PASSWORD'];
  const previousSecret = process.env['CONTROLS_SECRET'];

  afterEach(() => {
    if (previousPassword === undefined) delete process.env['CONTROLS_PASSWORD'];
    else process.env['CONTROLS_PASSWORD'] = previousPassword;
    if (previousSecret === undefined) delete process.env['CONTROLS_SECRET'];
    else process.env['CONTROLS_SECRET'] = previousSecret;
  });

  it('reads CONTROLS_PASSWORD and CONTROLS_SECRET from the environment', () => {
    process.env['CONTROLS_PASSWORD'] = 'settings-secret';
    process.env['CONTROLS_SECRET'] = 'hmac-secret';
    expect(getConfiguredControlsPassword()).toBe('settings-secret');
    expect(getControlsSecret()).toBe('hmac-secret');
  });

  it('falls back to a derived secret when CONTROLS_SECRET is unset', () => {
    process.env['CONTROLS_PASSWORD'] = 'settings-secret';
    delete process.env['CONTROLS_SECRET'];
    expect(getControlsSecret()).toBe('knox-controls-fallback:settings-secret');
  });

  it('builds and clears the controls cookie', () => {
    const cookie = buildControlsCookie('abc.def');
    expect(cookie).toContain(`${CONTROLS_COOKIE}=abc.def`);
    expect(cookie).toContain('HttpOnly');
    expect(clearControlsCookie()).toContain('Max-Age=0');
  });

  it('verifies access from the controls cookie header', async () => {
    process.env['CONTROLS_PASSWORD'] = 'settings-secret';
    process.env['CONTROLS_SECRET'] = 'hmac-secret';
    const token = await createGateToken('hmac-secret', 60);
    const header = `${CONTROLS_COOKIE}=${token}`;
    expect(await verifyControlsAccess(header)).toBe(true);
    expect(await verifyControlsAccess(null)).toBe(false);
  });
});
