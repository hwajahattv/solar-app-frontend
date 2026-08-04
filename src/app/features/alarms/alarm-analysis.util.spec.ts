import { describe, expect, it } from 'vitest';

import { Alarm } from '../../core/models/alarm.model';
import { dateRangeForAlarms, reportLabelForAlarmTitle } from './alarm-analysis.util';

describe('reportLabelForAlarmTitle', () => {
  it('maps LINE_FAIL to Power Outage Report', () => {
    expect(reportLabelForAlarmTitle('LINE_FAIL')).toBe('Power Outage Report');
    expect(reportLabelForAlarmTitle('Line Fail')).toBe('Power Outage Report');
  });

  it('maps PV LOSS to PV Outage Report', () => {
    expect(reportLabelForAlarmTitle('PV LOSS')).toBe('PV Outage Report');
    expect(reportLabelForAlarmTitle('PV_LOSS')).toBe('PV Outage Report');
  });

  it('builds a readable report name for other titles', () => {
    expect(reportLabelForAlarmTitle('BATTERY_LOW')).toBe('Battery Low Report');
    expect(reportLabelForAlarmTitle('Grid Over Voltage')).toBe('Grid Over Voltage Report');
  });
});

describe('dateRangeForAlarms', () => {
  it('covers started and cleared timestamps', () => {
    const alarms: Alarm[] = [
      {
        title: 'LINE_FAIL',
        description: null,
        active: false,
        startedAt: '2026-01-10T08:00:00.000Z',
        clearedAt: '2026-01-10T10:00:00.000Z',
        durationMs: 7_200_000,
        code: null,
      },
      {
        title: 'LINE_FAIL',
        description: null,
        active: false,
        startedAt: '2026-02-01T12:00:00.000Z',
        clearedAt: '2026-02-01T13:00:00.000Z',
        durationMs: 3_600_000,
        code: null,
      },
    ];

    const range = dateRangeForAlarms(alarms);
    expect(range.from?.toISOString()).toBe('2026-01-10T08:00:00.000Z');
    expect(range.to?.toISOString()).toBe('2026-02-01T13:00:00.000Z');
    expect(range.label).toContain('2026');
  });
});
