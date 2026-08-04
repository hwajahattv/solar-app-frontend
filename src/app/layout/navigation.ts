export interface NavigationItem {
  path: string;
  label: string;
  /** Shorter label used by the handset bottom bar where space is tight. */
  shortLabel: string;
  icon: string;
}

/** Single source of truth for navigation, reused by the rail and the bottom bar. */
export const NAVIGATION_ITEMS: readonly NavigationItem[] = [
  { path: '/dashboard', label: 'Energy flow', shortLabel: 'Flow', icon: 'bolt' },
  { path: '/history', label: 'Data logger', shortLabel: 'History', icon: 'history' },
  { path: '/controls', label: 'Inverter settings', shortLabel: 'Settings', icon: 'tune' },
  { path: '/alarms', label: 'Alarms', shortLabel: 'Alarms', icon: 'notifications_active' },
  { path: '/diagnostics', label: 'Diagnostics', shortLabel: 'Debug', icon: 'terminal' },
];
