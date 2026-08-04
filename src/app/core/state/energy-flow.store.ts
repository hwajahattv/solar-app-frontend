import { effect, inject, Injectable, signal, untracked } from '@angular/core';

import { TelemetryApiService } from '../api/telemetry-api.service';
import { DeviceRef } from '../models/device.model';
import { EnergyFlow } from '../models/energy-flow.model';
import { DeviceStore } from './device.store';
import { RefreshService } from './refresh.service';

@Injectable({ providedIn: 'root' })
export class EnergyFlowStore {
  private readonly api = inject(TelemetryApiService);
  private readonly devices = inject(DeviceStore);
  private readonly refresh = inject(RefreshService);

  private readonly _flow = signal<EnergyFlow | null>(null);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);

  readonly flow = this._flow.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  constructor() {
    effect(() => {
      const device = this.devices.selectedRef();
      this.refresh.tick();

      if (!device) return;
      untracked(() => this.load(device));
    });
  }

  private load(device: DeviceRef): void {
    // Keep the previous reading on screen while the next one is in flight so the
    // dashboard never flashes empty during polling.
    this._loading.set(true);

    this.api.energyFlow(device).subscribe({
      next: (flow) => {
        this._flow.set(flow);
        this._error.set(null);
        this._loading.set(false);
      },
      error: (error: Error) => {
        this._error.set(error.message);
        this._loading.set(false);
      },
    });
  }
}
