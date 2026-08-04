export interface HistoryColumn {
  index: number;
  title: string;
  constant: boolean;
  hidden: boolean;
}

export interface HistoryRow {
  index: number;
  timestamp: string | null;
  values: Array<string | null>;
}

export interface HistorySummaryItem {
  label: string;
  value: string | null;
}

export interface HistoryPage {
  date: string;
  page: number;
  pageSize: number;
  total: number;
  timestampColumnIndex: number;
  columns: HistoryColumn[];
  rows: HistoryRow[];
  summary: HistorySummaryItem[];
}
