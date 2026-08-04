import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  effect,
  ElementRef,
  input,
  OnDestroy,
  untracked,
  viewChild,
} from '@angular/core';
import * as echarts from 'echarts/core';
import { LineChart } from 'echarts/charts';
import {
  DataZoomComponent,
  GridComponent,
  LegendComponent,
  TitleComponent,
  TooltipComponent,
} from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import type { ECharts, EChartsCoreOption } from 'echarts/core';

import { ChartSeries } from '../../../core/models/charts.model';

echarts.use([
  LineChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  TitleComponent,
  DataZoomComponent,
  CanvasRenderer,
]);

const SERIES_COLORS = [
  '#3d9cfd',
  '#38d6a8',
  '#f6c344',
  '#ff6b6b',
  '#a78bfa',
  '#fb923c',
  '#22d3ee',
  '#f472b6',
];

export interface TimeSeriesChartModel {
  series: ChartSeries[];
  leftUnit: string | null;
  rightUnit: string | null;
}

@Component({
  selector: 'app-time-series-chart',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<div class="chart-host" #host role="img" [attr.aria-label]="ariaLabel()"></div>`,
  styles: `
    :host {
      display: block;
      width: 100%;
      min-height: 22rem;
    }

    .chart-host {
      width: 100%;
      height: 100%;
      min-height: 22rem;
    }
  `,
})
export class TimeSeriesChart implements OnDestroy {
  readonly model = input.required<TimeSeriesChartModel>();
  readonly ariaLabel = input('Time series chart');

  private readonly host = viewChild.required<ElementRef<HTMLDivElement>>('host');
  private chart: ECharts | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private ready = false;

  constructor() {
    afterNextRender(() => {
      this.initChart();
      this.ready = true;
      this.render(this.model());
    });

    effect(() => {
      const next = this.model();
      untracked(() => {
        if (this.ready) this.render(next);
      });
    });
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
    this.chart?.dispose();
    this.chart = null;
  }

  private initChart(): void {
    const el = this.host().nativeElement;
    this.chart = echarts.init(el, undefined, { renderer: 'canvas' });
    this.resizeObserver = new ResizeObserver(() => this.chart?.resize());
    this.resizeObserver.observe(el);
  }

  private render(model: TimeSeriesChartModel): void {
    if (!this.chart) return;

    if (model.series.length === 0) {
      this.chart.clear();
      this.chart.setOption({
        title: {
          text: 'Select quantities to plot',
          left: 'center',
          top: 'middle',
          textStyle: { color: '#9aadc8', fontSize: 14, fontWeight: 400 },
        },
      });
      return;
    }

    this.chart.setOption(buildOption(model), { notMerge: true });
  }
}

function buildOption(model: TimeSeriesChartModel): EChartsCoreOption {
  const dual = Boolean(model.rightUnit);
  const unitAxisIndex = new Map<string, number>();
  if (model.leftUnit) unitAxisIndex.set(model.leftUnit, 0);
  if (model.rightUnit) unitAxisIndex.set(model.rightUnit, 1);

  const yAxis = dual
    ? [axisStyle(model.leftUnit ?? '', 'left'), axisStyle(model.rightUnit ?? '', 'right')]
    : [axisStyle(model.leftUnit ?? '', 'left')];

  return {
    backgroundColor: 'transparent',
    animation: false,
    color: SERIES_COLORS,
    grid: { left: 56, right: dual ? 56 : 24, top: 48, bottom: 72 },
    legend: {
      type: 'scroll',
      top: 0,
      textStyle: { color: '#c5d0e0' },
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'cross' },
    },
    dataZoom: [
      { type: 'inside', xAxisIndex: 0, filterMode: 'none' },
      {
        type: 'slider',
        xAxisIndex: 0,
        height: 22,
        bottom: 12,
        borderColor: '#2a364d',
        fillerColor: 'rgba(61, 156, 253, 0.18)',
        handleStyle: { color: '#3d9cfd' },
        textStyle: { color: '#9aadc8' },
        dataBackground: {
          lineStyle: { color: '#3d9cfd' },
          areaStyle: { color: 'rgba(61, 156, 253, 0.12)' },
        },
      },
    ],
    xAxis: {
      type: 'time',
      axisLine: { lineStyle: { color: '#2a364d' } },
      axisLabel: { color: '#9aadc8' },
      splitLine: { show: false },
    },
    yAxis,
    series: model.series.map((series) => ({
      name: `${series.title} (${series.unit || '—'})`,
      type: 'line',
      showSymbol: false,
      sampling: 'lttb',
      yAxisIndex: unitAxisIndex.get(series.unit) ?? 0,
      data: series.points
        .filter((point) => point.v !== null)
        .map((point) => [toChartTime(point.t), point.v as number]),
    })),
  };
}

function axisStyle(unit: string, position: 'left' | 'right') {
  return {
    type: 'value' as const,
    position,
    name: unit,
    nameTextStyle: { color: '#9aadc8' },
    axisLine: { show: true, lineStyle: { color: '#2a364d' } },
    axisLabel: { color: '#9aadc8' },
    splitLine: {
      lineStyle: { color: 'rgba(42, 54, 77, 0.85)', type: 'dashed' as const },
    },
    scale: true,
  };
}

function toChartTime(value: string): number {
  const normalized = value.includes('T') ? value : value.replace(' ', 'T');
  const ms = Date.parse(normalized);
  return Number.isFinite(ms) ? ms : Date.parse(value);
}
