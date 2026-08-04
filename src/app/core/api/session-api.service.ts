import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { SessionStatus } from '../models/session.model';
import { API_BASE_URL } from './api.config';

@Injectable({ providedIn: 'root' })
export class SessionApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  status(): Observable<SessionStatus> {
    return this.http.get<SessionStatus>(`${this.baseUrl}/session`);
  }

  refresh(): Observable<SessionStatus> {
    return this.http.post<SessionStatus>(`${this.baseUrl}/session/refresh`, {});
  }
}
