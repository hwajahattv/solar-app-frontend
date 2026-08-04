export interface ChartField {
  id: string;
  title: string;
  unit: string;
  /** Normalized unit bucket for picker grouping. */
  group: string;
}

export interface ChartFieldsResponse {
  fields: ChartField[];
}

export interface ChartPoint {
  t: string;
  v: number | null;
}

export interface ChartSeries {
  id: string;
  title: string;
  unit: string;
  points: ChartPoint[];
}

export interface ChartSeriesResponse {
  from: string;
  to: string;
  precisionMinutes: number;
  series: ChartSeries[];
}
