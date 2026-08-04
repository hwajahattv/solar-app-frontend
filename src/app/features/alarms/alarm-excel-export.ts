import * as XLSX from 'xlsx';

import { Alarm } from '../../core/models/alarm.model';
import {
  alarmElapsedMs,
  AlarmDateRange,
  dateRangeForAlarms,
  fileDateToken,
  formatDurationMs,
  formatReportDateTime,
  reportLabelForAlarmTitle,
  slugifyReportName,
} from './alarm-analysis.util';

export interface AlarmReportSheet {
  alarmTitle: string;
  reportName: string;
  dateRange: AlarmDateRange;
  alarms: Alarm[];
}

export function buildAlarmReportSheet(alarmTitle: string, alarms: Alarm[]): AlarmReportSheet {
  return {
    alarmTitle,
    reportName: reportLabelForAlarmTitle(alarmTitle),
    dateRange: dateRangeForAlarms(alarms),
    alarms,
  };
}

export function exportAlarmReportToExcel(sheet: AlarmReportSheet): void {
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, buildWorksheet(sheet), safeSheetName(sheet.reportName));
  XLSX.writeFile(workbook, buildFilename(sheet));
}

export function exportAllAlarmReportsToExcel(sheets: AlarmReportSheet[]): void {
  if (sheets.length === 0) return;

  const workbook = XLSX.utils.book_new();
  const usedNames = new Set<string>();

  for (const sheet of sheets) {
    XLSX.utils.book_append_sheet(workbook, buildWorksheet(sheet), uniqueSheetName(sheet.reportName, usedNames));
  }

  const allAlarms = sheets.flatMap((sheet) => sheet.alarms);
  const range = dateRangeForAlarms(allAlarms);
  const from = fileDateToken(range.from);
  const to = fileDateToken(range.to);
  XLSX.writeFile(workbook, `Alarm_Analysis_Reports_${from}_to_${to}.xlsx`);
}

function buildWorksheet(sheet: AlarmReportSheet): XLSX.WorkSheet {
  const now = Date.now();
  const rows: Array<Array<string | number>> = [
    [sheet.reportName],
    [`Source alarm: ${sheet.alarmTitle}`],
    [`Date range: ${sheet.dateRange.label}`],
    [`Events: ${sheet.alarms.length}`],
    [],
    ['Started', 'Cleared', 'Duration', 'Status'],
    ...sheet.alarms.map((alarm) => [
      formatReportDateTime(alarm.startedAt),
      alarm.clearedAt ? formatReportDateTime(alarm.clearedAt) : 'Still active',
      formatDurationMs(alarmElapsedMs(alarm, now)),
      alarm.active ? 'Active' : 'Resolved',
    ]),
  ];

  const worksheet = XLSX.utils.aoa_to_sheet(rows);
  worksheet['!cols'] = [{ wch: 22 }, { wch: 22 }, { wch: 14 }, { wch: 12 }];
  return worksheet;
}

function buildFilename(sheet: AlarmReportSheet): string {
  const from = fileDateToken(sheet.dateRange.from);
  const to = fileDateToken(sheet.dateRange.to);
  return `${slugifyReportName(sheet.reportName)}_${from}_to_${to}.xlsx`;
}

function safeSheetName(name: string): string {
  // Excel sheet names max 31 chars and disallow \ / ? * [ ]
  return name.replace(/[\\/?*[\]:]/g, ' ').trim().slice(0, 31) || 'Report';
}

function uniqueSheetName(name: string, used: Set<string>): string {
  const base = safeSheetName(name);
  if (!used.has(base)) {
    used.add(base);
    return base;
  }

  let index = 2;
  while (used.has(`${base.slice(0, 28)}_${index}`)) index += 1;
  const unique = `${base.slice(0, 28)}_${index}`;
  used.add(unique);
  return unique;
}
