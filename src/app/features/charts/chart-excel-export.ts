import * as XLSX from 'xlsx';

import { ChartSeries } from '../../core/models/charts.model';

export function exportChartSeriesToExcel(
  series: ChartSeries[],
  from: string,
  to: string,
): void {
  if (series.length === 0) return;

  const workbook = XLSX.utils.book_new();
  const usedNames = new Set<string>();

  for (const item of series) {
    const rows: Array<Array<string | number>> = [
      [`${item.title} (${item.unit || '—'})`],
      [`Field id: ${item.id}`],
      [`Date range: ${from} – ${to}`],
      [],
      ['Timestamp', `Value (${item.unit || '—'})`],
      ...item.points.map((point) => [point.t, point.v ?? '']),
    ];

    const sheet = XLSX.utils.aoa_to_sheet(rows);
    sheet['!cols'] = [{ wch: 22 }, { wch: 16 }];
    XLSX.utils.book_append_sheet(workbook, sheet, uniqueSheetName(item.title || item.id, usedNames));
  }

  // Combined wide sheet for easy comparison
  const timestamps = collectSortedTimestamps(series);
  const header = ['Timestamp', ...series.map((item) => `${item.title} (${item.unit || '—'})`)];
  const valueMaps = series.map((item) => {
    const map = new Map<string, number | null>();
    for (const point of item.points) map.set(point.t, point.v);
    return map;
  });

  const combinedRows: Array<Array<string | number>> = [
    ['Charts export'],
    [`Date range: ${from} – ${to}`],
    [],
    header,
    ...timestamps.map((timestamp) => [
      timestamp,
      ...valueMaps.map((map) => {
        const value = map.get(timestamp);
        return value === undefined || value === null ? '' : value;
      }),
    ]),
  ];

  const combined = XLSX.utils.aoa_to_sheet(combinedRows);
  combined['!cols'] = [{ wch: 22 }, ...series.map(() => ({ wch: 18 }))];
  XLSX.utils.book_append_sheet(workbook, combined, 'Combined');

  const fromToken = from.slice(0, 10);
  const toToken = to.slice(0, 10);
  XLSX.writeFile(workbook, `Charts_${fromToken}_to_${toToken}.xlsx`);
}

function collectSortedTimestamps(series: ChartSeries[]): string[] {
  const set = new Set<string>();
  for (const item of series) {
    for (const point of item.points) set.add(point.t);
  }
  return [...set].sort((a, b) => a.localeCompare(b));
}

function uniqueSheetName(name: string, used: Set<string>): string {
  const base = name.replace(/[\\/?*[\]:]/g, ' ').trim().slice(0, 28) || 'Series';
  if (!used.has(base)) {
    used.add(base);
    return base;
  }
  let index = 2;
  while (used.has(`${base}_${index}`)) index += 1;
  const unique = `${base}_${index}`.slice(0, 31);
  used.add(unique);
  return unique;
}
