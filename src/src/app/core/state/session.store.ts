import { computed, inject, Injectable, signal } from '@angular/core';

import { SessionApiService } from '../api/session-api.service';
import { SessionStatus } from '../models/session.model';

/** How long to wait before re-checking a gateway that is not yet authenticated. */
const RETRY_DELAY_MS = 8000;

@Injectable({ providedIn: 'root' })
export class SessionStore {
  private readonly api = inject(SessionApiService);

  private readonly _status = signal<SessionStatus | null>(null);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);
  private retryHandle: ReturnType<typeof setTimeout> | null = null;

  readonly status = this._status.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  readonly ready = computed(() => this._status()?.authenticated === true);

  readonly blockingMessage = computed<string | null>(() => {
    if (this.ready()) return null;

    const error = this._error();
    if (error) return error;

    const status = this._status();
    if (!status) return null;
    if (!status.configured) return 'The gateway has no ShineMonitor credentials configured.';
    return status.error ?? 'The gateway could not sign in to ShineMonitor.';
  });

  /** Loads session state and keeps retrying until the gateway is authenticated. */
  load(): void {
    this.clearRetry();
    this._loading.set(true);

    this.api.status().subscribe({
      next: (status) => {
        this._status.set(status);
        this._error.set(null);
        this._loading.set(false);
        if (!status.authenticated) this.scheduleRetry();
      },
      error: (error: Error) => {
        this._status.set(null);
        this._error.set(error.message);
        this._loading.set(false);
        this.scheduleRetry();
      },
    });
  }

  refresh(): void {
    this._loading.set(true);
    this.api.refresh().subscribe({
      next: (status) => {
        this._status.set(status);
        this._error.set(null);
        this._loading.set(false);
      },
      error: (error: Error) => {
        this._error.set(error.message);
        this._loading.set(false);
      },
    });
  }

  private scheduleRetry(): void {
    this.clearRetry();
    this.retryHandle = setTimeout(() => this.load(), RETRY_DELAY_MS);
  }

  private clearRetry(): void {
    if (this.retryHandle !== null) clearTimeout(this.retryHandle);
    this.retryHandle = null;
  }
}
