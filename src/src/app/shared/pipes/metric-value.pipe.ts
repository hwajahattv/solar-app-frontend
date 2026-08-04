import { Pipe, PipeTransform } from '@angular/core';

const EM_DASH = '—';

/**
 * Formats a nullable measurement. Missing readings are common (a parameter may
 * simply not exist on a given inverter), so they render as a dash rather than
 * "null" or "0", which would be misleading on an energy dashboard.
 */
@Pipe({ name: 'metricValue' })
export class MetricValuePipe implements PipeTransform {
  transform(value: number | null | undefined, digits = 0): string {
    if (value === null || value === undefined || Number.isNaN(value)) return EM_DASH;

    return value.toLocaleString(undefined, {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    });
  }
}
