import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';

import { AlarmsApiService } from '../../core/api/alarms-api.service';
import { Alarm } from '../../core/models/alarm.model';
import { DeviceRef } from '../../core/models/device.model';
import { DeviceStore } from '../../core/state/device.store';
import { RefreshService } from '../../core/state/refresh.service';
import { DurationPipe } from '../../shared/pipes/duration.pipe';
import { StatusBanner } from '../../shared/ui/status-banner/status-banner';
import { AlarmDateRange, dateRangeForAlarms, reportLabelForAlarmTitle } from './alarm-analysis.util';
import {
  AlarmReportSheet,
  buildAlarmReportSheet,
  exportAlarmReportToExcel,
  exportAllAlarmReportsToExcel,
} from './alarm-excel-export';

export interface AlarmAnalysisGroup {
  title: string;
  reportName: string;
  dateRange: AlarmDateRange;
  alarms: Alarm[];
  activeCount: number;
}

@Component({
  selector: 'app-alarms',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DatePipe,
    DurationPipe,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatTooltipModule,
    StatusBanner,
  ],
  templateUrl: './alarms.html',
  styleUrl: './alarms.scss',
})
export class Alarms {
  private readonly api = inject(AlarmsApiService);
  private readonly devices = inject(DeviceStore);
  private readonly refresh = inject(RefreshService);

  protected readonly alarms = signal<Alarm[]>([]);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly analysisAlarms = signal<Alarm[]>([]);
  protected readonly analysisLoading = signal(false);
  protected readonly analysisError = signal<string | null>(null);

  protected readonly activeCount = computed(() => this.alarms().filter((alarm) => alarm.active).length);

  /** One table per distinct alarm title, newest events first. */
  protected readonly analysisGroups = computed((): AlarmAnalysisGroup[] => {
    const byTitle = new Map<string, Alarm[]>();

    for (const alarm of this.analysisAlarms()) {
      const key = alarm.title?.trim() || 'Alarm';
      const bucket = byTitle.get(key);
      if (bucket) bucket.push(alarm);
      else byTitle.set(key, [alarm]);
    }

    return [...byTitle.entries()]
      .map(([title, alarms]) => {
        const sorted = [...alarms].sort((a, b) => compareStartedDesc(a, b));
        return {
          title,
          reportName: reportLabelForAlarmTitle(title),
          dateRange: dateRangeForAlarms(sorted),
          alarms: sorted,
          activeCount: sorted.filter((alarm) => alarm.active).length,
        };
      })
      .sort((a, b) => b.activeCount - a.activeCount || b.alarms.length - a.alarms.length || a.reportName.localeCompare(b.reportName));
  });

  protected readonly analysisReportSheets = computed((): AlarmReportSheet[] =>
    this.analysisGroups().map((group) => buildAlarmReportSheet(group.title, group.alarms)),
  );

  constructor() {
    effect(() => {
      const device = this.devices.selectedRef();
      // Recent cards follow the shared polling clock.
      this.refresh.tick();

      if (!device) return;
      untracked(() => this.loadListing(device));
    });

    effect(() => {
      const device = this.devices.selectedRef();
      // Full-history analysis only reloads when the selected inverter changes
      // (and on manual Reload) so we do not page the gateway every poll tick.
      if (!device) return;
      untracked(() => this.loadAnalysis(device));
    });
  }

  protected reload(): void {
    const device = this.devices.selectedRef();
    if (!device) return;
    this.loadListing(device);
    this.loadAnalysis(device);
  }

  /** Live elapsed time for alarms that have not cleared yet. */
  protected elapsed(alarm: Alarm): number | null {
    if (alarm.durationMs !== null) return alarm.durationMs;
    if (!alarm.startedAt) return null;

    return Date.now() - new Date(alarm.startedAt).getTime();
  }

  protected exportGroup(group: AlarmAnalysisGroup): void {
    exportAlarmReportToExcel(buildAlarmReportSheet(group.title, group.alarms));
  }

  protected exportAllReports(): void {
    exportAllAlarmReportsToExcel(this.analysisReportSheets());
  }

  private loadListing(device: DeviceRef): void {
    this.loading.set(true);
    this.error.set(null);

    this.api.list(device).subscribe({
      next: (page) => {
        this.alarms.set(page.alarms);
        this.loading.set(false);
      },
      error: (error: Error) => {
        this.error.set(error.message);
        this.loading.set(false);
      },
    });
  }

  private loadAnalysis(device: DeviceRef): void {
    this.analysisLoading.set(true);
    this.analysisError.set(null);

    this.api.listAll(device).subscribe({
      next: (alarms) => {
        this.analysisAlarms.set(alarms);
        this.analysisLoading.set(false);
      },
      error: (error: Error) => {
        this.analysisError.set(error.message);
        this.analysisLoading.set(false);
      },
    });
  }
}

function compareStartedDesc(a: Alarm, b: Alarm): number {
  const aTime = a.startedAt ? new Date(a.startedAt).getTime() : 0;
  const bTime = b.startedAt ? new Date(b.startedAt).getTime() : 0;
  return bTime - aTime;
}
