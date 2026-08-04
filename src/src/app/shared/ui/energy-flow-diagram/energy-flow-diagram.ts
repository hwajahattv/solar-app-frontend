import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

import { EnergyFlow } from '../../../core/models/energy-flow.model';
import { MetricValuePipe } from '../../pipes/metric-value.pipe';

interface FlowNode {
  key: 'grid' | 'solar' | 'battery';
  label: string;
  icon: string;
  primary: string;
  secondary: string;
  active: boolean;
  /** Charging reverses the beam so energy visibly flows into the battery. */
  reversed: boolean;
}

/**
 * Source → inverter → house diagram.
 *
 * Built from CSS grid and gradient "beams" rather than absolutely positioned
 * SVG, so the same markup reflows from a phone column to a TV wall layout
 * without any coordinate maths.
 */
@Component({
  selector: 'app-energy-flow-diagram',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule, MetricValuePipe],
  templateUrl: './energy-flow-diagram.html',
  styleUrl: './energy-flow-diagram.scss',
})
export class EnergyFlowDiagram {
  readonly flow = input.required<EnergyFlow>();

  protected readonly sources = computed<FlowNode[]>(() => {
    const flow = this.flow();

    return [
      {
        key: 'grid',
        label: 'Grid',
        icon: 'bolt',
        primary: flow.grid.voltage === null ? '—' : `${format(flow.grid.voltage, 0)} V`,
        secondary: flow.grid.online ? `${format(flow.grid.frequency, 1)} Hz` : 'not available',
        active: flow.grid.online,
        reversed: false,
      },
      {
        key: 'solar',
        label: 'Solar',
        icon: 'wb_sunny',
        primary: flow.solar.power === null ? '—' : `${format(flow.solar.power / 1000, 2)} kW`,
        secondary: flow.solar.voltage === null ? 'idle' : `${format(flow.solar.voltage, 0)} V`,
        active: flow.solar.active,
        reversed: false,
      },
      {
        key: 'battery',
        label: 'Battery',
        icon: 'battery_charging_full',
        primary: flow.battery.soc === null ? '—' : `${format(flow.battery.soc, 0)} %`,
        secondary: batteryHint(flow),
        active: flow.battery.active,
        reversed: flow.battery.charging && !flow.battery.discharging,
      },
    ];
  });

  protected readonly loadKilowatts = computed(() => {
    const power = this.flow().load.activePower;
    return power === null ? null : power / 1000;
  });

  protected readonly batteryPercent = computed(() => Math.max(0, Math.min(100, this.flow().battery.soc ?? 0)));

  /** Hue sweeps red at empty to green at full, matching the original dashboard. */
  protected readonly batteryHue = computed(() => this.batteryPercent() * 1.2);
}

function batteryHint(flow: EnergyFlow): string {
  if (flow.battery.charging) return `charging ${format(flow.battery.chargeCurrent, 0)} A`;
  if (flow.battery.discharging) return `discharging ${format(flow.battery.dischargeCurrent, 0)} A`;
  return 'idle';
}

function format(value: number | null, digits: number): string {
  return value === null ? '—' : value.toFixed(digits);
}
