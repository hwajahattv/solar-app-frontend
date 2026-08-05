import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { DeviceRef } from '../models/device.model';
import { DailyEnergyHistory } from '../models/daily-energy.model';
import { EnergyFlow } from '../models/energy-flow.model';
import { HistoryPage } from '../models/history.model';
import { API_BASE_URL } from './api.config';

@Injectable({ providedIn: 'root' })
export class TelemetryApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  energyFlow(device: DeviceRef): Observable<EnergyFlow> {
    return this.http.get<EnergyFlow>(`${this.baseUrl}/telemetry/energy-flow`, {
      params: new HttpParams({ fromObject: { ...device } }),
    });
  }

  history(device: DeviceRef, date: string, page: number, pageSize: number): Observable<HistoryPage> {
    return this.http.get<HistoryPage>(`${this.baseUrl}/telemetry/history`, {
      params: new HttpParams({ fromObject: { ...device, date, page, pageSize } }),
    });
  }

  dailyEnergyHistory(device: DeviceRef, from: string, to: string): Observable<DailyEnergyHistory> {
    return this.http.get<DailyEnergyHistory>(`${this.baseUrl}/telemetry/daily-energy`, {
      params: new HttpParams({ fromObject: { ...device, from, to } }),
    });
  }
}
