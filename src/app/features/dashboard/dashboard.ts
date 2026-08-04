import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';

import { PlatformService } from '../../core/platform/platform.service';
import { EnergyFlowStore } from '../../core/state/energy-flow.store';
import { MetricValuePipe } from '../../shared/pipes/metric-value.pipe';
import { CameraPanel } from '../../shared/ui/camera-panel/camera-panel';
import { EnergyFlowDiagram } from '../../shared/ui/energy-flow-diagram/energy-flow-diagram';
import { MetricAccent, MetricTile } from '../../shared/ui/metric-tile/metric-tile';
import { StatusBanner } from '../../shared/ui/status-banner/status-banner';

interface DashboardTile {
  key: string;
  label: string;
  value: string;
  unit: string | null;
  hint: string | null;
  icon: string;
  accent: MetricAccent;
  active: boolean;
}

@Component({
  selector: 'app-dashboard',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CameraPanel,
    DatePipe,
    EnergyFlowDiagram,
    MatIconModule,
    MatProgressBarModule,
    MetricTile,
    MetricValuePipe,
    StatusBanner,
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard {
  private readonly store = inject(EnergyFlowStore);

  protected readonly platform = inject(PlatformService);
  protected readonly flow = this.store.flow;
  protected readonly error = this.store.error;
  protected readonly loading = this.store.loading;

  protected readonly loadPercent = computed(() => {
    const percent = this.flow()?.load.loadPercent;
    return percent === null || percent === undefined ? 0 : Math.max(0, Math.min(100, percent));
  });

  protected readonly tiles = computed<DashboardTile[]>(() => {
    const flow = this.flow();
    if (!flow) return [];

    return [
      {
        key: 'grid',
        label: 'Grid',
        value: format(flow.grid.voltage, 0),
        unit: 'V',
        hint: flow.grid.online ? `${format(flow.grid.frequency, 1)} Hz · supplying` : 'not available',
        icon: 'bolt',
        accent: 'grid',
        active: flow.grid.online,
      },
      {
        key: 'solar',
        label: 'Solar',
        value: format(flow.solar.power, 0),
        unit: 'W',
        hint: `${format(flow.solar.voltage, 0)} V · ${format(flow.solar.current, 1)} A`,
        icon: 'wb_sunny',
        accent: 'solar',
        active: flow.solar.active,
      },
      {
        key: 'battery',
        label: 'Battery',
        value: format(flow.battery.soc, 0),
        unit: '%',
        hint: batteryHint(flow.battery),
        icon: 'battery_full',
        accent: 'battery',
        active: flow.battery.active,
      },
      {
        key: 'load',
        label: 'House load',
        value: format(flow.load.activePower, 0),
        unit: 'W',
        hint: `${format(flow.load.current, 1)} A · ${format(flow.load.apparentPower, 0)} VA`,
        icon: 'house',
        accent: 'load',
        active: flow.load.active,
      },
    ];
  });
}

function batteryHint(battery: { charging: boolean; discharging: boolean; chargeCurrent: number | null; dischargeCurrent: number | null }): string {
  if (battery.charging) return `charging at ${format(battery.chargeCurrent, 0)} A`;
  if (battery.discharging) return `discharging at ${format(battery.dischargeCurrent, 0)} A`;
  return 'idle';
}

function format(value: number | null, digits: number): string {
  return value === null ? '—' : value.toFixed(digits);
}
