import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

import { EnergyFlow } from '../../../core/models/energy-flow.model';
import { MetricValuePipe } from '../../pipes/metric-value.pipe';

interface FlowWire {
  id: string;
  /** Left-to-right layout: sources on the left, inverter centre, house right. */
  widePath: string;
  /** Portrait layout: sources across the top, inverter centre, house bottom. */
  stackPath: string;
  active: boolean;
  reversed: boolean;
  accent: 'grid' | 'solar' | 'battery' | 'battery-charge' | 'load';
}

interface FlowNode {
  key: string;
  label: string;
  icon: string;
  primary: string;
  secondary: string;
  active: boolean;
  accent: 'grid' | 'solar' | 'battery' | 'battery-charge' | 'load' | 'inverter';
  position: 'grid' | 'solar' | 'battery' | 'inverter' | 'load';
  hero?: boolean;
}

/** Source → inverter → house diagram with SVG wires (legacy-style). */
@Component({
  selector: 'app-energy-flow-diagram',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule, MetricValuePipe],
  templateUrl: './energy-flow-diagram.html',
  styleUrl: './energy-flow-diagram.scss',
})
export class EnergyFlowDiagram {
  readonly flow = input.required<EnergyFlow>();

  protected readonly wires = computed<FlowWire[]>(() => {
    const flow = this.flow();
    const batteryCharging = flow.battery.charging && !flow.battery.discharging;

    // Coordinates are percentages of the diagram box and match the node anchors
    // in the stylesheet exactly, so a wire always ends underneath its node.
    return [
      {
        id: 'grid',
        widePath: 'M 16 18 C 34 18, 34 50, 50 50',
        stackPath: 'M 17 18 C 17 34, 50 34, 50 50',
        active: flow.grid.online,
        reversed: false,
        accent: 'grid',
      },
      {
        id: 'solar',
        widePath: 'M 16 50 L 50 50',
        stackPath: 'M 50 18 L 50 50',
        active: flow.solar.active,
        reversed: false,
        accent: 'solar',
      },
      {
        id: 'battery',
        widePath: 'M 16 82 C 34 82, 34 50, 50 50',
        stackPath: 'M 83 18 C 83 34, 50 34, 50 50',
        active: flow.battery.active,
        reversed: batteryCharging,
        accent: batteryCharging ? 'battery-charge' : 'battery',
      },
      {
        id: 'load',
        widePath: 'M 50 50 L 84 50',
        stackPath: 'M 50 50 L 50 82',
        active: flow.load.active,
        reversed: false,
        accent: 'load',
      },
    ];
  });

  protected readonly nodes = computed<FlowNode[]>(() => {
    const flow = this.flow();
    const batteryCharging = flow.battery.charging && !flow.battery.discharging;
    const loadKw = flow.load.activePower === null ? '—' : `${format(flow.load.activePower / 1000, 2)} kW`;

    return [
      {
        key: 'grid',
        label: 'Grid',
        icon: 'bolt',
        primary: flow.grid.voltage === null ? '—' : `${format(flow.grid.voltage, 0)} V`,
        secondary: flow.grid.online ? `${format(flow.grid.frequency, 1)} Hz` : 'not available',
        active: flow.grid.online,
        accent: 'grid',
        position: 'grid',
      },
      {
        key: 'solar',
        label: 'Solar',
        icon: 'wb_sunny',
        primary: flow.solar.power === null ? '—' : `${format(flow.solar.power / 1000, 2)} kW`,
        secondary: flow.solar.voltage === null ? 'idle' : `${format(flow.solar.voltage, 0)} V`,
        active: flow.solar.active,
        accent: 'solar',
        position: 'solar',
      },
      {
        key: 'battery',
        label: 'Battery',
        icon: batteryCharging ? 'battery_charging_full' : 'battery_full',
        primary: flow.battery.soc === null ? '—' : `${format(flow.battery.soc, 0)} %`,
        secondary: batteryHint(flow),
        active: flow.battery.active,
        accent: batteryCharging ? 'battery-charge' : 'battery',
        position: 'battery',
      },
      {
        key: 'inverter',
        label: 'Inverter',
        icon: 'settings_input_component',
        primary: flow.mode ?? '—',
        // Summary already appears in the dashboard badge; keep the node compact.
        secondary: '',
        active: true,
        accent: 'inverter',
        position: 'inverter',
      },
      {
        key: 'load',
        label: 'House load',
        icon: 'house',
        primary: loadKw,
        secondary: `${format(flow.load.current, 1)} A`,
        active: flow.load.active,
        accent: 'load',
        position: 'load',
        hero: true,
      },
    ];
  });

  protected readonly batteryPercent = computed(() => Math.max(0, Math.min(100, this.flow().battery.soc ?? 0)));

  /** Hue sweeps red at empty to green at full, matching the original dashboard. */
  protected readonly batteryHue = computed(() => this.batteryPercent() * 1.2);

  protected readonly batteryCharging = computed(
    () => this.flow().battery.charging && !this.flow().battery.discharging,
  );
}

function batteryHint(flow: EnergyFlow): string {
  if (flow.battery.charging) return `charging ${format(flow.battery.chargeCurrent, 0)} A`;
  if (flow.battery.discharging) return `discharging ${format(flow.battery.dischargeCurrent, 0)} A`;
  return 'idle';
}

function format(value: number | null, digits: number): string {
  return value === null ? '—' : value.toFixed(digits);
}
