import { computed, inject, Injectable, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { AccessApiService } from '../api/access-api.service';

const STORAGE_KEY = 'knox.access';

interface StoredAccess {
  token: string;
  expiresAt: string;
}

@Injectable({ providedIn: 'root' })
export class AccessStore {
  private readonly api = inject(AccessApiService);

  private readonly _token = signal<string | null>(null);
  private readonly _expiresAt = signal<string | null>(null);

  readonly token = this._token.asReadonly();
  readonly expiresAt = this._expiresAt.asReadonly();

  readonly unlocked = computed(() => {
    const token = this._token();
    const expiresAt = this._expiresAt();
    if (!token || !expiresAt) return false;
    return Date.parse(expiresAt) > Date.now();
  });

  constructor() {
    this.restore();
  }

  async unlock(pin: string): Promise<void> {
    const result = await firstValueFrom(this.api.unlock(pin));
    this.persist(result.token, result.expiresAt);
  }

  clear(): void {
    this._token.set(null);
    this._expiresAt.set(null);
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      // sessionStorage may be unavailable in some embedded browsers.
    }
  }

  private persist(token: string, expiresAt: string): void {
    this._token.set(token);
    this._expiresAt.set(expiresAt);
    try {
      const payload: StoredAccess = { token, expiresAt };
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // Keep in-memory token even if persistence fails.
    }
  }

  private restore(): void {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as StoredAccess;
      if (!parsed.token || !parsed.expiresAt) {
        this.clear();
        return;
      }
      if (Date.parse(parsed.expiresAt) <= Date.now()) {
        this.clear();
        return;
      }
      this._token.set(parsed.token);
      this._expiresAt.set(parsed.expiresAt);
    } catch {
      this.clear();
    }
  }
}
