import { ChangeDetectionStrategy, Component, computed, effect, inject, OnInit, signal, untracked } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { environment } from '../../../environments/environment';
import { NotificationService } from '../../core/notifications/notification.service';
import { PlatformService } from '../../core/platform/platform.service';
import { SpatialNavDirective } from '../../core/platform/spatial-nav.directive';
import { DeviceStore } from '../../core/state/device.store';
import { REFRESH_INTERVAL_OPTIONS, RefreshService } from '../../core/state/refresh.service';
import { SessionStore } from '../../core/state/session.store';
import { StatusBanner } from '../../shared/ui/status-banner/status-banner';
import { NAVIGATION_ITEMS } from '../navigation';

/**
 * Application frame. Owns connection bootstrapping and the navigation chrome so
 * feature screens only have to render content.
 */
@Component({
  selector: 'app-shell',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatToolbarModule,
    MatTooltipModule,
    RouterLink,
    RouterLinkActive,
    RouterOutlet,
    SpatialNavDirective,
    StatusBanner,
  ],
  templateUrl: './shell.html',
  styleUrl: './shell.scss',
})
export class Shell implements OnInit {
  private readonly session = inject(SessionStore);
  private readonly notifications = inject(NotificationService);

  protected readonly platform = inject(PlatformService);
  protected readonly devices = inject(DeviceStore);
  protected readonly refresh = inject(RefreshService);

  protected readonly navigationItems = NAVIGATION_ITEMS;
  protected readonly intervalOptions = REFRESH_INTERVAL_OPTIONS;

  protected readonly ready = this.session.ready;
  protected readonly blockingMessage = this.session.blockingMessage;
  protected readonly sessionStatus = this.session.status;

  protected readonly connecting = computed(() => !this.ready() && this.blockingMessage() === null);
  /** PIN lock is only useful on the Vercel-hosted SPA (Edge gate). */
  protected readonly showPinLock = signal(environment.production && typeof window !== 'undefined' && !/^(localhost|127\.0\.0\.1)$/.test(window.location.hostname));
  protected readonly locking = signal(false);

  constructor() {
    // Devices can only be listed once the gateway holds an upstream session.
    effect(() => {
      if (!this.ready()) return;

      untracked(() => {
        if (this.devices.devices().length === 0 && !this.devices.loading()) this.devices.load();
      });
    });
  }

  ngOnInit(): void {
    this.session.load();
  }

  protected onDeviceChange(pn: string): void {
    this.devices.select(pn);
  }

  protected onIntervalChange(value: number): void {
    this.refresh.intervalMs.set(value);
  }

  protected retryConnection(): void {
    this.session.refresh();
  }

  protected async lockDashboard(): Promise<void> {
    if (this.locking()) return;
    this.locking.set(true);
    try {
      const response = await fetch('/api/pin/lock', { method: 'POST' });
      if (!response.ok) {
        throw new Error('Lock request failed');
      }
      window.location.href = '/login.html';
    } catch {
      this.notifications.error('Could not lock the dashboard. Try again.');
      this.locking.set(false);
    }
  }
}
