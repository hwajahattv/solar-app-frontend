import { Injectable, signal } from '@angular/core';

import { environment } from '../../../environments/environment';

export interface ControlsAccessStatus {
  configured: boolean;
  unlocked: boolean;
  error?: string;
}

/**
 * Tracks whether the user has unlocked inverter settings on this device.
 * Unlock state lives in an HttpOnly cookie set by /api/controls/unlock.
 */
@Injectable({ providedIn: 'root' })
export class ControlsAccessService {
  private readonly _checked = signal(false);
  private readonly _unlocked = signal(false);
  private readonly _configured = signal(true);
  private readonly _error = signal<string | null>(null);
  private readonly _unlocking = signal(false);

  readonly checked = this._checked.asReadonly();
  readonly unlocked = this._unlocked.asReadonly();
  readonly configured = this._configured.asReadonly();
  readonly error = this._error.asReadonly();
  readonly unlocking = this._unlocking.asReadonly();

  /** True when the edge gate routes exist (Vercel-hosted production build). */
  readonly gateAvailable = environment.production;

  async refresh(): Promise<void> {
    this._error.set(null);

    if (!this.gateAvailable) {
      this._configured.set(false);
      this._unlocked.set(true);
      this._checked.set(true);
      return;
    }

    try {
      const response = await fetch('/api/controls/status', {
        credentials: 'same-origin',
        cache: 'no-store',
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as ControlsAccessStatus;
        this._configured.set(body.configured ?? true);
        this._unlocked.set(false);
        this._error.set(body.error ?? 'Unable to verify settings access.');
        this._checked.set(true);
        return;
      }

      const body = (await response.json()) as ControlsAccessStatus;
      this._configured.set(body.configured);
      this._unlocked.set(body.unlocked);
      this._checked.set(true);
    } catch {
      this._configured.set(false);
      this._unlocked.set(false);
      this._error.set('Unable to reach the settings gate.');
      this._checked.set(true);
    }
  }

  async unlock(password: string): Promise<boolean> {
    this._unlocking.set(true);
    this._error.set(null);

    try {
      const response = await fetch('/api/controls/unlock', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: password.trim() }),
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as { error?: string };
        this._error.set(body.error ?? 'Incorrect password');
        this._unlocked.set(false);
        return false;
      }

      this._unlocked.set(true);
      this._configured.set(true);
      return true;
    } catch {
      this._error.set('Unable to unlock settings. Try again.');
      return false;
    } finally {
      this._unlocking.set(false);
    }
  }

  async lock(): Promise<void> {
    if (!this.gateAvailable) {
      this._unlocked.set(true);
      return;
    }

    try {
      await fetch('/api/controls/lock', {
        method: 'POST',
        credentials: 'same-origin',
      });
    } finally {
      this._unlocked.set(false);
    }
  }
}
