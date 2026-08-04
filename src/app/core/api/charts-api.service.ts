import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { ChartFieldsResponse, ChartSeriesResponse } from '../models/charts.model';
import { DeviceRef } from '../models/device.model';
import { API_BASE_URL } from './api.config';

@Injectable({ providedIn: 'root' })
export class ChartsApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  fields(device: DeviceRef, lang = 'en_US'): Observable<ChartFieldsResponse> {
    return this.http.get<ChartFieldsResponse>(`${this.baseUrl}/charts/fields`, {
      params: new HttpParams({ fromObject: { ...device, lang } }),
    });
  }

  series(
    device: DeviceRef,
    fields: string[],
    from: string,
    to: string,
    precision = 5,
  ): Observable<ChartSeriesResponse> {
    return this.http.get<ChartSeriesResponse>(`${this.baseUrl}/charts/series`, {
      params: new HttpParams({
        fromObject: {
          ...device,
          fields: fields.join(','),
          from,
          to,
          precision,
        },
      }),
    });
  }
}
