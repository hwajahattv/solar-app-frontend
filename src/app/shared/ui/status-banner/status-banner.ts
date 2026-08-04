import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

export type BannerTone = 'info' | 'warn' | 'error';

/** Full-width message used for connection state and empty results. */
@Component({
  selector: 'app-status-banner',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonModule, MatIconModule, MatProgressSpinnerModule],
  template: `
    <div class="banner" [attr.data-tone]="tone()" role="status">
      @if (busy()) {
        <mat-spinner diameter="20" />
      } @else {
        <mat-icon>{{ icon() }}</mat-icon>
      }

      <div class="banner__text">
        <span class="banner__title">{{ title() }}</span>
        @if (detail()) {
          <span class="banner__detail">{{ detail() }}</span>
        }
      </div>

      @if (actionLabel()) {
        <button mat-stroked-button type="button" (click)="action.emit()">{{ actionLabel() }}</button>
      }
    </div>
  `,
  styleUrl: './status-banner.scss',
})
export class StatusBanner {
  readonly title = input.required<string>();
  readonly detail = input<string | null>(null);
  readonly tone = input<BannerTone>('info');
  readonly icon = input('info');
  readonly busy = input(false);
  readonly actionLabel = input<string | null>(null);

  readonly action = output<void>();
}
