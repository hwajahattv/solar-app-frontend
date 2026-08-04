import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { API_BASE_URL } from './api.config';

export interface CameraStatus {
  configured: boolean;
  activeStreams: number;
  maxStreams: number;
}

@Injectable({ providedIn: 'root' })
export class CameraApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  status(): Observable<CameraStatus> {
    return this.http.get<CameraStatus>(`${this.baseUrl}/camera/status`);
  }

  /** The cache-buster forces a fresh multipart connection on every retry. */
  streamUrl(): string {
    return `${this.baseUrl}/camera/stream?t=${Date.now()}`;
  }

  snapshotUrl(): string {
    return `${this.baseUrl}/camera/snapshot?t=${Date.now()}`;
  }
}
