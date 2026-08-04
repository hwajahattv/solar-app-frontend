import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

export type MetricAccent = 'grid' | 'solar' | 'battery' | 'load' | 'neutral';

/**
 * Presentational tile for a single measurement. Deliberately stateless so it can
 * be reused unchanged by the future mobile and TV clients.
 */
@Component({
  selector: 'app-metric-tile',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule],
  template: `
    <div class="tile" [class.tile--active]="active()" [attr.data-accent]="accent()">
      <div class="tile__head">
        @if (icon()) {
          <mat-icon class="tile__icon">{{ icon() }}</mat-icon>
        }
        <span class="tile__label">{{ label() }}</span>
        @if (active()) {
          <span class="tile__dot" aria-hidden="true"></span>
        }
      </div>

      <div class="tile__value">
        <span class="tile__number">{{ value() }}</span>
        @if (unit()) {
          <span class="tile__unit">{{ unit() }}</span>
        }
      </div>

      @if (hint()) {
        <div class="tile__hint">{{ hint() }}</div>
      }
    </div>
  `,
  styleUrl: './metric-tile.scss',
  host: { '[attr.aria-label]': 'ariaLabel()' },
})
export class MetricTile {
  readonly label = input.required<string>();
  readonly value = input.required<string>();
  readonly unit = input<string | null>(null);
  readonly hint = input<string | null>(null);
  readonly icon = input<string | null>(null);
  readonly accent = input<MetricAccent>('neutral');
  readonly active = input(false);

  protected readonly ariaLabel = computed(() => `${this.label()}: ${this.value()} ${this.unit() ?? ''}`.trim());
}
