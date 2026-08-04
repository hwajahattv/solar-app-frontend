import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';

import { API_BASE_URL } from '../../core/api/api.config';
import { PlatformService } from '../../core/platform/platform.service';
import { Surface, SURFACES } from '../../core/platform/surface';
import { DeviceStore } from '../../core/state/device.store';
import { SessionStore } from '../../core/state/session.store';
import { StatusBanner } from '../../shared/ui/status-banner/status-banner';

/** Actions that are safe to run without changing inverter state. */
const READ_ONLY_ACTIONS = [
  'querySPDeviceLastData',
  'queryDeviceParsEs',
  'webQueryDeviceEs',
  'queryPlantInfo',
  'queryDeviceCtrlField',
];

@Component({
  selector: 'app-diagnostics',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    StatusBanner,
  ],
  templateUrl: './diagnostics.html',
  styleUrl: './diagnostics.scss',
})
export class Diagnostics {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  protected readonly platform = inject(PlatformService);
  protected readonly session = inject(SessionStore);
  protected readonly devices = inject(DeviceStore);

  protected readonly surfaces = SURFACES;
  protected readonly presets = READ_ONLY_ACTIONS;

  protected readonly action = signal(READ_ONLY_ACTIONS[0]);
  protected readonly response = signal<string | null>(null);
  protected readonly error = signal<string | null>(null);
  protected readonly running = signal(false);

  protected setSurface(surface: Surface): void {
    // Setting the same surface twice clears the override and returns to detection.
    this.platform.setOverride(this.platform.surface() === surface ? null : surface);
  }

  protected run(): void {
    const device = this.devices.selectedRef();
    this.running.set(true);
    this.error.set(null);

    this.http
      .post<unknown>(`${this.baseUrl}/diagnostics/shine-call`, {
        action: this.action(),
        params: { ...(device ?? {}), i18n: 'en_US' },
      })
      .subscribe({
        next: (result) => {
          this.response.set(JSON.stringify(result, null, 2));
          this.running.set(false);
        },
        error: (error: Error) => {
          this.error.set(error.message);
          this.response.set(null);
          this.running.set(false);
        },
      });
  }
}
