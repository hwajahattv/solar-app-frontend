import { Alarm } from '../../core/models/alarm.model';

export interface AlarmDateRange {
  from: Date | null;
  to: Date | null;
  /** Human-readable range, e.g. "12 Jan 2026 – 4 Aug 2026". */
  label: string;
}

const KNOWN_REPORT_LABELS: Record<string, string> = {
  LINE_FAIL: 'Power Outage Report',
  PV_LOSS: 'PV Outage Report',
};

function normalizeTitleKey(title: string): string {
  return title.trim().toUpperCase().replace(/[\s_-]+/g, '_');
}

/** Normalise inverter alarm titles into readable Excel / UI report names. */
export function reportLabelForAlarmTitle(title: string): string {
  const raw = (title ?? '').trim() || 'Alarm';
  const known = KNOWN_REPORT_LABELS[normalizeTitleKey(raw)];
  if (known) return known;

  const keepUpper = new Set(['PV', 'AC', 'DC', 'UPS', 'SOC', 'SOH', 'EPS']);
  const words = raw
    .replace(/[_-]+/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => {
      const upper = word.toUpperCase();
      if (keepUpper.has(upper)) return upper;
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    });

  const base = words.join(' ') || 'Alarm';
  return /report$/i.test(base) ? base : `${base} Report`;
}

export function dateRangeForAlarms(alarms: Alarm[]): AlarmDateRange {
  let fromMs = Number.POSITIVE_INFINITY;
  let toMs = Number.NEGATIVE_INFINITY;

  for (const alarm of alarms) {
    if (alarm.startedAt) {
      const started = new Date(alarm.startedAt).getTime();
      if (Number.isFinite(started)) {
        fromMs = Math.min(fromMs, started);
        toMs = Math.max(toMs, started);
      }
    }
    if (alarm.clearedAt) {
      const cleared = new Date(alarm.clearedAt).getTime();
      if (Number.isFinite(cleared)) {
        toMs = Math.max(toMs, cleared);
      }
    } else if (alarm.active && alarm.startedAt) {
      toMs = Math.max(toMs, Date.now());
    }
  }

  if (!Number.isFinite(fromMs) || !Number.isFinite(toMs)) {
    return { from: null, to: null, label: 'No dated events' };
  }

  const from = new Date(fromMs);
  const to = new Date(toMs);
  return {
    from,
    to,
    label: `${formatReportDate(from)} – ${formatReportDate(to)}`,
  };
}

export function formatReportDate(date: Date): string {
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

export function formatReportDateTime(value: string | null): string {
  if (!value) return '—';
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return '—';
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(date);
}

export function formatDurationMs(milliseconds: number | null | undefined): string {
  if (milliseconds === null || milliseconds === undefined || milliseconds < 0) return '—';

  const seconds = Math.floor(milliseconds / 1000);
  const parts: string[] = [];
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds / 3600) % 24);
  const minutes = Math.floor((seconds / 60) % 60);
  const remainder = seconds % 60;

  if (days) parts.push(`${days}d`);
  if (hours) parts.push(`${hours}h`);
  if (minutes) parts.push(`${minutes}m`);
  if (remainder || parts.length === 0) parts.push(`${remainder}s`);
  return parts.join(' ');
}

export function alarmElapsedMs(alarm: Alarm, now = Date.now()): number | null {
  if (alarm.durationMs !== null) return alarm.durationMs;
  if (!alarm.startedAt) return null;
  return now - new Date(alarm.startedAt).getTime();
}

export function slugifyReportName(label: string): string {
  return label
    .trim()
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .replace(/_+/g, '_');
}

export function fileDateToken(date: Date | null): string {
  if (!date) return 'undated';
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
