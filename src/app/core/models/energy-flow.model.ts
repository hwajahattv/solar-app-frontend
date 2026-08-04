export type EnergySourceKind = 'grid' | 'solar' | 'battery';

export interface GridState {
  online: boolean;
  voltage: number | null;
  frequency: number | null;
}

export interface SolarState {
  active: boolean;
  power: number | null;
  voltage: number | null;
  current: number | null;
}

export interface BatteryState {
  active: boolean;
  charging: boolean;
  discharging: boolean;
  soc: number | null;
  voltage: number | null;
  chargeCurrent: number | null;
  dischargeCurrent: number | null;
  /** Positive when the battery supplies the load, negative while charging. */
  power: number | null;
}

export interface LoadState {
  active: boolean;
  activePower: number | null;
  apparentPower: number | null;
  current: number | null;
  outputVoltage: number | null;
  loadPercent: number | null;
}

export interface DailyEnergy {
  /** PV generation today (kWh), integrated from PV power samples. */
  generatedTodayKwh: number | null;
  /** Load consumption today (kWh). */
  consumedTodayKwh: number | null;
  /** Energy charged into the battery today (kWh). */
  batteryChargedTodayKwh: number | null;
  /** Energy supplied by the battery today (kWh). */
  batteryDischargedTodayKwh: number | null;
}

export interface EnergyFlow {
  readingAt: string | null;
  fetchedAt: string;
  /** IANA zone used for readingAt / fetchedAt (e.g. Asia/Karachi). */
  timezone?: string;
  mode: string | null;
  activeSources: EnergySourceKind[];
  summary: string;
  grid: GridState;
  solar: SolarState;
  battery: BatteryState;
  load: LoadState;
  energy: DailyEnergy;
}
