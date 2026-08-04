import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';

import { AccessStore } from '../state/access.store';

/** Attaches the access PIN unlock bearer token when one is present. */
export const accessTokenInterceptor: HttpInterceptorFn = (request, next) => {
  const access = inject(AccessStore);
  const token = access.unlocked() ? access.token() : null;
  if (!token) return next(request);

  return next(
    request.clone({
      setHeaders: { Authorization: `Bearer ${token}` },
    }),
  );
};
