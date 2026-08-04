import { InjectionToken } from '@angular/core';

import { environment } from '../../../environments/environment';

/**
 * Base URL of the Knox Solar Gateway. Exposed as a token rather than imported
 * directly so a future mobile or TV shell can point the same services at an
 * absolute gateway address without touching feature code.
 */
export const API_BASE_URL = new InjectionToken<string>('API_BASE_URL', {
  providedIn: 'root',
  factory: () => environment.apiBaseUrl,
});
