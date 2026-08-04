import { inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { CanActivateFn, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { AccessStore } from '../state/access.store';
import { PinUnlockDialog } from '../../shared/ui/pin-unlock-dialog/pin-unlock-dialog';

/**
 * Gates Controls and Diagnostics behind an access PIN unlock.
 * Cancel redirects to the dashboard.
 */
export const accessPinGuard: CanActivateFn = async () => {
  const access = inject(AccessStore);
  const dialog = inject(MatDialog);
  const router = inject(Router);

  if (access.unlocked()) return true;

  const unlocked = await firstValueFrom(
    dialog
      .open(PinUnlockDialog, {
        width: 'min(420px, 92vw)',
        disableClose: true,
        autoFocus: 'first-tabbable',
      })
      .afterClosed(),
  );

  if (unlocked) return true;

  return router.createUrlTree(['/dashboard']);
};
