import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
  untracked,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';

import { ChartsApiService } from '../../core/api/charts-api.service';
import { ChartField, ChartSeries } from '../../core/models/charts.model';
import { DeviceRef } from '../../core/models/device.model';
import { NotificationService } from '../../core/notifications/notification.service';
import { DeviceStore } from '../../core/state/device.store';
import { StatusBanner } from '../../shared/ui/status-banner/status-banner';
import { TimeSeriesChart, TimeSeriesChartModel } from '../../shared/ui/time-series-chart/time-series-chart';
import { exportChartSeriesToExcel } from './chart-excel-export';

const MAX_SELECTED_FIELDS = 6;
const MAX_RANGE_DAYS = 7;
const DEFAULT_FIELD_PREFERENCES = [
  'calc_pv_generation_kwh',
  'calc_load_consumption_kwh',
  'bt_load_active_power_sole',
  'output_power',
  'bt_output_power_1',
  'bt_input_power_1',
];

@Component({
  selector: 'app-charts',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    MatButtonModule,
    MatCheckboxModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatNativeDateModule,
    MatProgressBarModule,
    MatTooltipModule,
    StatusBanner,
    TimeSeriesChart,
  ],
  templateUrl: './charts.html',
  styleUrl: './charts.scss',
})
export class Charts {
  private readonly api = inject(ChartsApiService);
  private readonly devices = inject(DeviceStore);
  private readonly notifications = inject(NotificationService);

  protected readonly fromDate = signal(startOfLocalDay(new Date()));
  protected readonly toDate = signal(startOfLocalDay(new Date()));

  protected readonly catalog = signal<ChartField[]>([]);
  protected readonly catalogLoading = signal(false);
  protected readonly catalogError = signal<string | null>(null);

  protected readonly selectedIds = signal<string[]>([]);
  protected readonly series = signal<ChartSeries[]>([]);
  protected readonly seriesLoading = signal(false);
  protected readonly seriesError = signal<string | null>(null);
  protected readonly loadedFrom = signal('');
  protected readonly loadedTo = signal('');

  private seriesRequestToken = 0;
  private seriesDebounce: ReturnType<typeof setTimeout> | null = null;

  protected readonly fieldsByGroup = computed(() => {
    const groups = new Map<string, ChartField[]>();
    for (const field of this.catalog()) {
      const bucket = groups.get(field.unit) ?? [];
      bucket.push(field);
      groups.set(field.unit, bucket);
    }
    return [...groups.entries()]
      .map(([unit, fields]) => ({
        unit,
        fields: fields.slice().sort((a, b) => a.title.localeCompare(b.title)),
      }))
      .sort((a, b) => a.unit.localeCompare(b.unit));
  });

  protected readonly selectedFields = computed(() => {
    const byId = new Map(this.catalog().map((field) => [field.id, field]));
    return this.selectedIds()
      .map((id) => byId.get(id))
      .filter((field): field is ChartField => Boolean(field));
  });

  protected readonly axisUnits = computed(() => {
    const units: string[] = [];
    for (const field of this.selectedFields()) {
      if (!units.includes(field.unit)) units.push(field.unit);
    }
    return units;
  });

  protected readonly chartModel = computed((): TimeSeriesChartModel => {
    const units = this.axisUnits();
    const selected = new Set(this.selectedIds());
    return {
      series: this.series().filter((item) => selected.has(item.id)),
      leftUnit: units[0] ?? null,
      rightUnit: units[1] ?? null,
    };
  });

  constructor() {
    effect(() => {
      const device = this.devices.selectedRef();
      if (!device) return;
      untracked(() => this.loadCatalog(device));
    });

    effect(() => {
      const device = this.devices.selectedRef();
      const from = this.fromDate();
      const to = this.toDate();
      const ids = this.selectedIds();

      if (!device || ids.length === 0) {
        untracked(() => {
          this.series.set([]);
          this.seriesError.set(null);
        });
        return;
      }

      untracked(() => this.scheduleSeriesLoad(device, from, to, ids));
    });
  }

  protected isSelected(id: string): boolean {
    return this.selectedIds().includes(id);
  }

  protected toggleField(field: ChartField, checked: boolean): void {
    if (checked) {
      this.trySelect(field);
      return;
    }
    this.selectedIds.update((ids) => ids.filter((id) => id !== field.id));
  }

  protected onFromChange(value: Date | null): void {
    if (!value) return;
    const next = startOfLocalDay(value);
    this.fromDate.set(next);
    if (this.toDate().getTime() < next.getTime()) {
      this.toDate.set(next);
    }
  }

  protected onToChange(value: Date | null): void {
    if (!value) return;
    const next = startOfLocalDay(value);
    this.toDate.set(next);
    if (this.fromDate().getTime() > next.getTime()) {
      this.fromDate.set(next);
    }
  }

  protected reload(): void {
    const device = this.devices.selectedRef();
    if (!device) return;
    this.loadCatalog(device);
    if (this.selectedIds().length > 0) {
      this.loadSeries(device, this.fromDate(), this.toDate(), this.selectedIds());
    }
  }

  protected exportExcel(): void {
    const model = this.chartModel();
    if (model.series.length === 0) {
      this.notifications.info('Select and load at least one quantity before exporting.');
      return;
    }
    exportChartSeriesToExcel(
      model.series,
      this.loadedFrom() || formatDateParam(this.fromDate()),
      this.loadedTo() || formatDateParam(this.toDate()),
    );
  }

  private trySelect(field: ChartField): void {
    const current = this.selectedFields();
    if (current.some((item) => item.id === field.id)) return;

    if (current.length >= MAX_SELECTED_FIELDS) {
      this.notifications.info(`You can plot at most ${MAX_SELECTED_FIELDS} quantities.`);
      return;
    }

    const units = new Set(current.map((item) => item.unit));
    if (!units.has(field.unit) && units.size >= 2) {
      this.notifications.info('Charts support at most two unit types (dual Y-axis).');
      return;
    }

    const rangeError = validateRange(this.fromDate(), this.toDate());
    if (rangeError) {
      this.notifications.error(rangeError);
      return;
    }

    this.selectedIds.update((ids) => [...ids, field.id]);
  }

  private loadCatalog(device: DeviceRef): void {
    this.catalogLoading.set(true);
    this.catalogError.set(null);

    this.api.fields(device).subscribe({
      next: (response) => {
        this.catalog.set(response.fields);
        this.catalogLoading.set(false);
        if (this.selectedIds().length === 0) {
          this.selectedIds.set(pickDefaultFields(response.fields));
        }
      },
      error: (error: Error) => {
        this.catalogError.set(error.message);
        this.catalogLoading.set(false);
      },
    });
  }

  private scheduleSeriesLoad(device: DeviceRef, from: Date, to: Date, ids: string[]): void {
    if (this.seriesDebounce) clearTimeout(this.seriesDebounce);
    this.seriesDebounce = setTimeout(() => {
      this.seriesDebounce = null;
      this.loadSeries(device, from, to, ids);
    }, 300);
  }

  private loadSeries(device: DeviceRef, from: Date, to: Date, ids: string[]): void {
    const rangeError = validateRange(from, to);
    if (rangeError) {
      this.seriesError.set(rangeError);
      this.series.set([]);
      return;
    }

    const token = ++this.seriesRequestToken;
    this.seriesLoading.set(true);
    this.seriesError.set(null);

    this.api.series(device, ids, formatDateParam(from), formatDateParam(to)).subscribe({
      next: (response) => {
        if (token !== this.seriesRequestToken) return;
        this.series.set(response.series);
        this.loadedFrom.set(response.from);
        this.loadedTo.set(response.to);
        this.seriesLoading.set(false);
      },
      error: (error: Error) => {
        if (token !== this.seriesRequestToken) return;
        this.seriesError.set(error.message);
        this.seriesLoading.set(false);
      },
    });
  }
}

function startOfLocalDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function formatDateParam(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function validateRange(from: Date, to: Date): string | null {
  const fromMs = startOfLocalDay(from).getTime();
  const toMs = startOfLocalDay(to).getTime();
  if (toMs < fromMs) return 'End date must be on or after the start date.';
  const days = (toMs - fromMs) / (24 * 60 * 60 * 1000) + 1;
  if (days > MAX_RANGE_DAYS) return `Date range must not exceed ${MAX_RANGE_DAYS} days.`;
  return null;
}

function pickDefaultFields(fields: ChartField[]): string[] {
  const calcPair = ['calc_pv_generation_kwh', 'calc_load_consumption_kwh'].filter((id) =>
    fields.some((field) => field.id === id),
  );
  if (calcPair.length > 0) return calcPair;

  for (const id of DEFAULT_FIELD_PREFERENCES) {
    const match = fields.find((field) => field.id === id);
    if (!match) continue;
    const sameUnit = fields.filter((field) => field.unit === match.unit).slice(0, 2);
    return sameUnit.map((field) => field.id);
  }
  return fields[0] ? [fields[0].id] : [];
}
