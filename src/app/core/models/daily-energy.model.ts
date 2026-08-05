export interface DailyEnergyRecord {
  day: string;
  generatedTodayKwh: number | null;
  consumedTodayKwh: number | null;
  batteryChargedTodayKwh: number | null;
  batteryDischargedTodayKwh: number | null;
  computedAt: string;
}

export interface DailyEnergyHistory {
  from: string;
  to: string;
  records: DailyEnergyRecord[];
}
