import { ChangeDetectionStrategy, Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatNativeDateModule } from '@angular/material/core';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';

import { TelemetryApiService } from '../../core/api/telemetry-api.service';
import { HistoryColumn, HistoryPage, HistoryRow } from '../../core/models/history.model';
import { DeviceStore } from '../../core/state/device.store';
import { StatusBanner } from '../../shared/ui/status-banner/status-banner';

@Component({
  selector: 'app-history',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    MatButtonModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatNativeDateModule,
    MatPaginatorModule,
    MatSelectModule,
    StatusBanner,
  ],
  templateUrl: './history.html',
  styleUrl: './history.scss',
})
export class History {
  private readonly api = inject(TelemetryApiService);
  private readonly devices = inject(DeviceStore);

  protected readonly date = signal<Date>(new Date());
  protected readonly page = signal(0);
  protected readonly pageSize = signal(15);
  protected readonly selectedRowIndex = signal(0);

  protected readonly result = signal<HistoryPage | null>(null);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);

  /** Columns worth showing in the table; constants move to the summary cards. */
  protected readonly visibleColumns = computed<HistoryColumn[]>(
    () => this.result()?.columns.filter((column) => !column.hidden) ?? [],
  );

  protected readonly selectedRow = computed<HistoryRow | null>(() => {
    const rows = this.result()?.rows ?? [];
    return rows[this.selectedRowIndex()] ?? rows[0] ?? null;
  });

  /** Full detail for one log record, including the columns hidden in the table. */
  protected readonly selectedDetail = computed(() => {
    const row = this.selectedRow();
    const columns = this.result()?.columns ?? [];
    if (!row) return [];

    return columns
      .filter((column) => !column.constant)
      .map((column) => ({ label: column.title, value: row.values[column.index] ?? '—' }));
  });

  constructor() {
    effect(() => {
      const device = this.devices.selectedRef();
      const date = this.date();
      const page = this.page();
      const pageSize = this.pageSize();

      if (!device) return;
      untracked(() => this.load(device, date, page, pageSize));
    });
  }

  protected onPage(event: PageEvent): void {
    this.pageSize.set(event.pageSize);
    this.page.set(event.pageIndex);
  }

  protected selectRow(index: number): void {
    this.selectedRowIndex.set(index);
  }

  protected cellValue(row: HistoryRow, column: HistoryColumn): string {
    return row.values[column.index] ?? '—';
  }

  private load(
    device: NonNullable<ReturnType<DeviceStore['selectedRef']>>,
    date: Date,
    page: number,
    pageSize: number,
  ): void {
    this.loading.set(true);
    this.error.set(null);

    this.api.history(device, toIsoDay(date), page, pageSize).subscribe({
      next: (result) => {
        this.result.set(result);
        this.selectedRowIndex.set(0);
        this.loading.set(false);
      },
      error: (error: Error) => {
        this.error.set(error.message);
        this.result.set(null);
        this.loading.set(false);
      },
    });
  }
}

/** Formats a local date as YYYY-MM-DD without shifting it into UTC. */
function toIsoDay(date: Date): string {
  const pad = (value: number): string => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}
