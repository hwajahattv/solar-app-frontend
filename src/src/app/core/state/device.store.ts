import { computed, inject, Injectable, signal } from '@angular/core';

import { DevicesApiService } from '../api/devices-api.service';
import { Device, DeviceRef, toDeviceRef } from '../models/device.model';

const SELECTED_DEVICE_KEY = 'knox.selected-device';

@Injectable({ providedIn: 'root' })
export class DeviceStore {
  private readonly api = inject(DevicesApiService);

  private readonly _devices = signal<Device[]>([]);
  private readonly _selectedPn = signal<string | null>(globalThis.localStorage?.getItem(SELECTED_DEVICE_KEY) ?? null);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);

  readonly devices = this._devices.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  readonly selected = computed<Device | null>(() => {
    const devices = this._devices();
    if (devices.length === 0) return null;
    return devices.find((device) => device.pn === this._selectedPn()) ?? devices[0];
  });

  readonly selectedRef = computed<DeviceRef | null>(() => {
    const device = this.selected();
    return device ? toDeviceRef(device) : null;
  });

  load(): void {
    this._loading.set(true);
    this._error.set(null);

    this.api.list().subscribe({
      next: (devices) => {
        this._devices.set(devices);
        this._loading.set(false);
      },
      error: (error: Error) => {
        this._error.set(error.message);
        this._loading.set(false);
      },
    });
  }

  select(pn: string): void {
    this._selectedPn.set(pn);
    globalThis.localStorage?.setItem(SELECTED_DEVICE_KEY, pn);
  }
}
