import { Routes } from '@angular/router';

import { accessPinGuard } from './core/guards/access-pin.guard';

/**
 * Every feature is lazily loaded. On a TV or a low-end phone this keeps the
 * initial bundle small enough to reach first paint quickly.
 */
export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
  {
    path: 'dashboard',
    title: 'Energy flow · Knox Solar',
    loadComponent: () => import('./features/dashboard/dashboard').then((m) => m.Dashboard),
  },
  {
    path: 'history',
    title: 'Data logger · Knox Solar',
    loadComponent: () => import('./features/history/history').then((m) => m.History),
  },
  {
    path: 'controls',
    title: 'Inverter settings · Knox Solar',
    canActivate: [accessPinGuard],
    loadComponent: () => import('./features/controls/controls').then((m) => m.Controls),
  },
  {
    path: 'alarms',
    title: 'Alarms · Knox Solar',
    loadComponent: () => import('./features/alarms/alarms').then((m) => m.Alarms),
  },
  {
    path: 'diagnostics',
    title: 'Diagnostics · Knox Solar',
    canActivate: [accessPinGuard],
    loadComponent: () => import('./features/diagnostics/diagnostics').then((m) => m.Diagnostics),
  },
  { path: '**', redirectTo: 'dashboard' },
];
