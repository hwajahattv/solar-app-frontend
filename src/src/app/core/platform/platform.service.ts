import { BreakpointObserver } from '@angular/cdk/layout';
import { DOCUMENT, computed, effect, inject, Injectable, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';

import { isTenFootSurface, isTouchSurface, Surface } from './surface';

/** Breakpoints are expressed once here and consumed as a surface everywhere else. */
const BREAKPOINTS = {
  handset: '(max-width: 599.98px)',
  tablet: '(min-width: 600px) and (max-width: 1023.98px)',
  tv: '(min-width: 1600px) and (pointer: coarse), (min-width: 1600px) and (hover: none)',
} as const;

/** User agents that identify living-room devices, which rarely report coarse pointers. */
const TV_USER_AGENT = /smart-?tv|googletv|appletv|hbbtv|netcast|webos|tizen|viera|bravia|aft[bsm]|crkey/i;

const SURFACE_OVERRIDE_KEY = 'knox.surface-override';

/**
 * Resolves the current surface and publishes it both as a signal and as a class
 * on <html>, which is what the responsive design tokens key off.
 */
@Injectable({ providedIn: 'root' })
export class PlatformService {
  private readonly document = inject(DOCUMENT);
  private readonly breakpoints = inject(BreakpointObserver);

  /** Manual override, used to preview the TV layout on a desktop browser. */
  private readonly override = signal<Surface | null>(this.readOverride());

  private readonly detected = toSignal(
    this.breakpoints.observe([BREAKPOINTS.handset, BREAKPOINTS.tablet, BREAKPOINTS.tv]).pipe(
      map((state): Surface => {
        if (this.isTvUserAgent() || state.breakpoints[BREAKPOINTS.tv]) return 'tv';
        if (state.breakpoints[BREAKPOINTS.handset]) return 'handset';
        if (state.breakpoints[BREAKPOINTS.tablet]) return 'tablet';
        return 'desktop';
      }),
    ),
    { initialValue: 'desktop' as Surface },
  );

  readonly surface = computed<Surface>(() => this.override() ?? this.detected());

  readonly isHandset = computed(() => this.surface() === 'handset');
  readonly isTv = computed(() => isTenFootSurface(this.surface()));
  readonly isTouch = computed(() => isTouchSurface(this.surface()));

  /** Handsets get a bottom tab bar, everything else gets a side rail. */
  readonly navigationMode = computed<'bottom' | 'rail'>(() => (this.isHandset() ? 'bottom' : 'rail'));

  constructor() {
    effect(() => {
      const surface = this.surface();
      const root = this.document.documentElement;
      root.classList.remove('surface-handset', 'surface-tablet', 'surface-desktop', 'surface-tv');
      root.classList.add(`surface-${surface}`);
    });
  }

  setOverride(surface: Surface | null): void {
    this.override.set(surface);

    if (surface) {
      globalThis.localStorage?.setItem(SURFACE_OVERRIDE_KEY, surface);
    } else {
      globalThis.localStorage?.removeItem(SURFACE_OVERRIDE_KEY);
    }
  }

  private readOverride(): Surface | null {
    const stored = globalThis.localStorage?.getItem(SURFACE_OVERRIDE_KEY);
    return stored === 'handset' || stored === 'tablet' || stored === 'desktop' || stored === 'tv' ? stored : null;
  }

  private isTvUserAgent(): boolean {
    return TV_USER_AGENT.test(this.document.defaultView?.navigator.userAgent ?? '');
  }
}
