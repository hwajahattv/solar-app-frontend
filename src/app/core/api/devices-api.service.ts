import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { Device } from '../models/device.model';
import { API_BASE_URL } from './api.config';

@Injectable({ providedIn: 'root' })
export class DevicesApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  list(): Observable<Device[]> {
    return this.http.get<Device[]>(`${this.baseUrl}/devices`);
  }
}
