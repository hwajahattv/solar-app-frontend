import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { AccessTokenResponse } from '../models/access.model';
import { API_BASE_URL } from './api.config';

@Injectable({ providedIn: 'root' })
export class AccessApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  unlock(pin: string): Observable<AccessTokenResponse> {
    return this.http.post<AccessTokenResponse>(`${this.baseUrl}/access/unlock`, { pin });
  }
}
