/**
 * The four form factors the UI is designed against. Every layout decision keys
 * off this instead of raw pixel widths, so the same components can be reused by
 * a future native mobile or TV shell by forcing the surface.
 */
export type Surface = 'handset' | 'tablet' | 'desktop' | 'tv';

export const SURFACES: readonly Surface[] = ['handset', 'tablet', 'desktop', 'tv'];

/** True when the surface is driven by touch rather than a pointer. */
export function isTouchSurface(surface: Surface): boolean {
  return surface === 'handset' || surface === 'tablet';
}

/** True when the surface is operated from a distance with a remote control. */
export function isTenFootSurface(surface: Surface): boolean {
  return surface === 'tv';
}
