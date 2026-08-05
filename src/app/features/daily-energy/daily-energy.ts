import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
  untracked,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';

import { TelemetryApiService } from '../../core/api/telemetry-api.service';
import { ChartSeries } from '../../core/models/charts.model';
import { DailyEnergyHistory, DailyEnergyRecord } from '../../core/models/daily-energy.model';
import { DeviceRef } from '../../core/models/device.model';
import { DeviceStore } from '../../core/state/device.store';
import { MetricValuePipe } from '../../shared/pipes/metric-value.pipe';
import { StatusBanner } from '../../shared/ui/status-banner/status-banner';
import { TimeSeriesChart, TimeSeriesChartModel } from '../../shared/ui/time-series-chart/time-series-chart';

const MAX_RANGE_DAYS = 90;
const DEFAULT_RANGE_DAYS = 30;

@Component({
  selector: 'app-daily-energy',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DatePipe,
    FormsModule,
    MatButtonModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatNativeDateModule,
    MatProgressBarModule,
    MetricValuePipe,
    StatusBanner,
    TimeSeriesChart,
  ],
  templateUrl: './daily-energy.html',
  styleUrl: './daily-energy.scss',
})
export class DailyEnergy {
  private readonly api = inject(TelemetryApiService);
  private readonly devices = inject(DeviceStore);

  protected readonly fromDate = signal(startOfLocalDay(addDays(new Date(), -(DEFAULT_RANGE_DAYS - 1))));
  protected readonly toDate = signal(startOfLocalDay(new Date()));

  protected readonly history = signal<DailyEnergyHistory | null>(null);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly rangeError = signal<string | null>(null);

  protected readonly records = computed(() => this.history()?.records ?? []);

  protected readonly totals = computed(() => sumRecords(this.records()));

  protected readonly chartModel = computed((): TimeSeriesChartModel => ({
    series: toChartSeries(this.records()),
    leftUnit: 'kWh',
    rightUnit: null,
  }));

  constructor() {
    effect(() => {
      const device = this.devices.selectedRef();
      const fromDate = this.fromDate();
      const toDate = this.toDate();

      if (!device) return;

      const from = toIsoDay(fromDate);
      const to = toIsoDay(toDate);
      if (from > to) {
        this.rangeError.set('From date must be on or before To date.');
        return;
      }

      const spanDays = daySpan(from, to);
      if (spanDays > MAX_RANGE_DAYS) {
        this.rangeError.set(`Date range must not exceed ${MAX_RANGE_DAYS} days.`);
        return;
      }

      this.rangeError.set(null);
      untracked(() => this.load(device, from, to));
    });
  }

  protected reload(): void {
    const device = this.devices.selectedRef();
    if (!device || this.rangeError()) return;
    this.load(device, toIsoDay(this.fromDate()), toIsoDay(this.toDate()));
  }

  protected setPreset(days: number): void {
    this.toDate.set(startOfLocalDay(new Date()));
    this.fromDate.set(startOfLocalDay(addDays(new Date(), -(days - 1))));
  }

  private load(device: DeviceRef, from: string, to: string): void {
    this.loading.set(true);
    this.error.set(null);

    this.api.dailyEnergyHistory(device, from, to).subscribe({
      next: (result) => {
        this.history.set(result);
        this.loading.set(false);
      },
      error: (err: Error) => {
        this.error.set(err.message);
        this.history.set(null);
        this.loading.set(false);
      },
    });
  }
}

function toChartSeries(records: DailyEnergyRecord[]): ChartSeries[] {
  if (records.length === 0) return [];

  return [
    {
      id: 'generated',
      title: 'Generated',
      unit: 'kWh',
      points: records.map((row) => ({ t: row.day, v: row.generatedTodayKwh })),
    },
    {
      id: 'consumed',
      title: 'Consumed',
      unit: 'kWh',
      points: records.map((row) => ({ t: row.day, v: row.consumedTodayKwh })),
    },
    {
      id: 'battery-charged',
      title: 'Battery stored',
      unit: 'kWh',
      points: records.map((row) => ({ t: row.day, v: row.batteryChargedTodayKwh })),
    },
    {
      id: 'battery-discharged',
      title: 'Battery supplied',
      unit: 'kWh',
      points: records.map((row) => ({ t: row.day, v: row.batteryDischargedTodayKwh })),
    },
  ];
}

function sumRecords(records: DailyEnergyRecord[]): {
  generatedTodayKwh: number | null;
  consumedTodayKwh: number | null;
  batteryChargedTodayKwh: number | null;
  batteryDischargedTodayKwh: number | null;
} {
  if (records.length === 0) {
    return {
      generatedTodayKwh: null,
      consumedTodayKwh: null,
      batteryChargedTodayKwh: null,
      batteryDischargedTodayKwh: null,
    };
  }

  return {
    generatedTodayKwh: sumNullable(records.map((row) => row.generatedTodayKwh)),
    consumedTodayKwh: sumNullable(records.map((row) => row.consumedTodayKwh)),
    batteryChargedTodayKwh: sumNullable(records.map((row) => row.batteryChargedTodayKwh)),
    batteryDischargedTodayKwh: sumNullable(records.map((row) => row.batteryDischargedTodayKwh)),
  };
}

function sumNullable(values: Array<number | null>): number | null {
  const finite = values.filter((value): value is number => value !== null && Number.isFinite(value));
  if (finite.length === 0) return null;
  return finite.reduce((total, value) => total + value, 0);
}

function startOfLocalDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function toIsoDay(date: Date): string {
  const pad = (value: number): string => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function daySpan(from: string, to: string): number {
  const start = Date.parse(`${from}T00:00:00`);
  const end = Date.parse(`${to}T00:00:00`);
  if (!Number.isFinite(start) || !Number.isFinite(end)) return 0;
  return Math.floor((end - start) / 86_400_000) + 1;
}
