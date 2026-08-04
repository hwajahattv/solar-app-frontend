import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { AlarmPage } from '../models/alarm.model';
import { DeviceRef } from '../models/device.model';
import { API_BASE_URL } from './api.config';

@Injectable({ providedIn: 'root' })
export class AlarmsApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  list(device: DeviceRef, page = 0, pageSize = 10): Observable<AlarmPage> {
    return this.http.get<AlarmPage>(`${this.baseUrl}/alarms`, {
      params: new HttpParams({ fromObject: { ...device, page, pageSize } }),
    });
  }
}
