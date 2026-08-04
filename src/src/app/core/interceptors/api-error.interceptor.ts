import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';

/** Error envelope produced by the gateway's global exception filter. */
interface ApiErrorBody {
  statusCode: number;
  message: string;
  error: string;
}

/**
 * Collapses transport and gateway errors into a single readable message so
 * feature code never has to inspect HttpErrorResponse shapes.
 */
export const apiErrorInterceptor: HttpInterceptorFn = (request, next) =>
  next(request).pipe(
    catchError((error: unknown) => {
      if (!(error instanceof HttpErrorResponse)) return throwError(() => error);

      return throwError(() => new Error(describe(error)));
    }),
  );

function describe(error: HttpErrorResponse): string {
  if (error.status === 0) {
    return 'Cannot reach the Knox Solar Gateway. Check that the backend is running.';
  }

  const body = error.error as ApiErrorBody | string | null;

  if (typeof body === 'string' && body.trim()) return body;
  if (body && typeof body === 'object' && body.message) return body.message;

  return `Request failed with status ${error.status}`;
}
