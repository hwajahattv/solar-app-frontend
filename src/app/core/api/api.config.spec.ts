import { TestBed } from '@angular/core/testing';

import { environment } from '../../../environments/environment';
import { API_BASE_URL } from './api.config';

describe('API_BASE_URL', () => {
  it('exposes the gateway URL from the environment', () => {
    const baseUrl = TestBed.inject(API_BASE_URL);
    expect(baseUrl).toBe(environment.apiBaseUrl);
    expect(baseUrl.length).toBeGreaterThan(0);
  });
});
