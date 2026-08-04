import { Directive, ElementRef, HostListener, inject, input } from '@angular/core';

/** Selector covering everything a remote control should be able to land on. */
const FOCUSABLE =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Directional focus movement for remote controls and keyboards.
 *
 * TV browsers do not implement CSS spatial navigation consistently, so arrow
 * keys are resolved here by picking the nearest focusable element in the
 * requested direction. Applying this at a container level keeps individual
 * feature components free of navigation concerns.
 */
@Directive({
  selector: '[appSpatialNav]',
})
export class SpatialNavDirective {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  /** Disable on surfaces that already have a pointer or touch input. */
  readonly enabled = input(true, { alias: 'appSpatialNav' });

  @HostListener('keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    if (!this.enabled()) return;

    const direction = DIRECTIONS[event.key];
    if (!direction) return;

    const target = this.findNeighbour(direction);
    if (!target) return;

    event.preventDefault();
    target.focus();
    target.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' });
  }

  private findNeighbour(direction: Direction): HTMLElement | null {
    const active = this.host.nativeElement.ownerDocument.activeElement as HTMLElement | null;
    if (!active) return null;

    const origin = active.getBoundingClientRect();
    const candidates = Array.from(this.host.nativeElement.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
      (element) => element !== active && element.offsetParent !== null,
    );

    let best: { element: HTMLElement; score: number } | null = null;

    for (const element of candidates) {
      const rect = element.getBoundingClientRect();
      const dx = rect.left + rect.width / 2 - (origin.left + origin.width / 2);
      const dy = rect.top + rect.height / 2 - (origin.top + origin.height / 2);

      const primary = direction.axis === 'x' ? dx * direction.sign : dy * direction.sign;
      if (primary <= 1) continue;

      // Weight off-axis drift heavily so focus travels along rows and columns.
      const secondary = Math.abs(direction.axis === 'x' ? dy : dx);
      const score = primary + secondary * 3;

      if (!best || score < best.score) best = { element, score };
    }

    return best?.element ?? null;
  }
}

interface Direction {
  axis: 'x' | 'y';
  sign: 1 | -1;
}

const DIRECTIONS: Record<string, Direction | undefined> = {
  ArrowRight: { axis: 'x', sign: 1 },
  ArrowLeft: { axis: 'x', sign: -1 },
  ArrowDown: { axis: 'y', sign: 1 },
  ArrowUp: { axis: 'y', sign: -1 },
};
