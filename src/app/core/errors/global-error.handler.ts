import { ErrorHandler, inject, Injectable, NgZone } from '@angular/core';

import { NotificationService } from '../notifications/notification.service';

/**
 * Surfaces unexpected errors to the user via the shared snackbar, instead of
 * failing silently after the browser global listeners log them.
 */
@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  private readonly notifications = inject(NotificationService);
  private readonly zone = inject(NgZone);

  handleError(error: unknown): void {
    console.error(error);

    const message =
      error instanceof Error
        ? error.message || 'Unexpected application error'
        : 'Unexpected application error';

    this.zone.run(() => {
      this.notifications.error(message);
    });
  }
}
