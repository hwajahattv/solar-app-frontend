export interface Alarm {
  title: string;
  description: string | null;
  active: boolean;
  startedAt: string | null;
  clearedAt: string | null;
  /** Null while the alarm is active so clients can tick a live counter from startedAt. */
  durationMs: number | null;
  code: string | null;
}

export interface AlarmPage {
  page: number;
  pageSize: number;
  total: number;
  alarms: Alarm[];
}
