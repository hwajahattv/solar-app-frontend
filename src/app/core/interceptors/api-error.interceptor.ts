import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';

import { NotificationService } from '../notifications/notification.service';
import { AccessStore } from '../state/access.store';

/** Error envelope produced by the gateway's global exception filter. */
interface ApiErrorBody {
  statusCode: number;
  message: string;
  error: string;
}

/**
 * Collapses transport and gateway errors into a single readable message so
 * feature code never has to inspect HttpErrorResponse shapes.
 * Clears the access token on 401 so gated routes can re-prompt for the PIN.
 */
export const apiErrorInterceptor: HttpInterceptorFn = (request, next) => {
  const access = inject(AccessStore);
  const notifications = inject(NotificationService);

  return next(request).pipe(
    catchError((error: unknown) => {
      if (!(error instanceof HttpErrorResponse)) return throwError(() => error);

      if (error.status === 401 && !request.url.includes('/access/unlock')) {
        access.clear();
        notifications.error('Access unlock expired. Enter the PIN again to continue.');
      }

      return throwError(() => new Error(describe(error)));
    }),
  );
};

function describe(error: HttpErrorResponse): string {
  if (error.status === 0) {
    return 'Cannot reach the Knox Solar Gateway. Check that the backend is running.';
  }

  const body = error.error as ApiErrorBody | string | null;

  if (typeof body === 'string' && body.trim()) return body;
  if (body && typeof body === 'object' && body.message) return body.message;

  return `Request failed with status ${error.status}`;
}
