import { effect, Injectable, signal } from '@angular/core';

import { environment } from '../../../environments/environment';

export const REFRESH_INTERVAL_OPTIONS = [
  { value: 5000, label: '5s' },
  { value: 10000, label: '10s' },
  { value: 30000, label: '30s' },
  { value: 60000, label: '1m' },
] as const;

/**
 * Single polling clock for the whole app. Feature stores subscribe to `tick`
 * rather than owning timers, so one interval drives every live view and the
 * app can be paused globally when it moves to the background.
 */
@Injectable({ providedIn: 'root' })
export class RefreshService {
  readonly intervalMs = signal<number>(environment.defaultRefreshIntervalMs);
  readonly running = signal(true);
  readonly tick = signal(0);

  constructor() {
    effect((onCleanup) => {
      if (!this.running()) return;

      const handle = setInterval(() => this.tick.update((value) => value + 1), this.intervalMs());
      onCleanup(() => clearInterval(handle));
    });
  }

  toggle(): void {
    this.running.update((running) => !running);
  }

  /** Forces an immediate refresh without waiting for the next interval. */
  refreshNow(): void {
    this.tick.update((value) => value + 1);
  }
}
