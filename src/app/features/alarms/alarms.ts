import { ChangeDetectionStrategy, Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { AlarmsApiService } from '../../core/api/alarms-api.service';
import { Alarm } from '../../core/models/alarm.model';
import { DeviceRef } from '../../core/models/device.model';
import { DeviceStore } from '../../core/state/device.store';
import { RefreshService } from '../../core/state/refresh.service';
import { DurationPipe } from '../../shared/pipes/duration.pipe';
import { StatusBanner } from '../../shared/ui/status-banner/status-banner';

@Component({
  selector: 'app-alarms',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, DurationPipe, MatButtonModule, MatIconModule, StatusBanner],
  templateUrl: './alarms.html',
  styleUrl: './alarms.scss',
})
export class Alarms {
  private readonly api = inject(AlarmsApiService);
  private readonly devices = inject(DeviceStore);
  private readonly refresh = inject(RefreshService);

  protected readonly alarms = signal<Alarm[]>([]);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly activeCount = computed(() => this.alarms().filter((alarm) => alarm.active).length);

  constructor() {
    effect(() => {
      const device = this.devices.selectedRef();
      // Alarms follow the shared polling clock rather than a timer of their own.
      this.refresh.tick();

      if (!device) return;
      untracked(() => this.load(device));
    });
  }

  protected reload(): void {
    const device = this.devices.selectedRef();
    if (device) this.load(device);
  }

  /** Live elapsed time for alarms that have not cleared yet. */
  protected elapsed(alarm: Alarm): number | null {
    if (alarm.durationMs !== null) return alarm.durationMs;
    if (!alarm.startedAt) return null;

    return Date.now() - new Date(alarm.startedAt).getTime();
  }

  private load(device: DeviceRef): void {
    this.loading.set(true);
    this.error.set(null);

    this.api.list(device).subscribe({
      next: (page) => {
        this.alarms.set(page.alarms);
        this.loading.set(false);
      },
      error: (error: Error) => {
        this.error.set(error.message);
        this.loading.set(false);
      },
    });
  }
}
