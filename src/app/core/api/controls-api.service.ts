import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { ControlField, ControlValue, ControlWriteResult, ProfileResult, ProfileStep } from '../models/control.model';
import { DeviceRef } from '../models/device.model';
import { API_BASE_URL } from './api.config';

@Injectable({ providedIn: 'root' })
export class ControlsApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  fields(device: DeviceRef): Observable<ControlField[]> {
    return this.http.get<ControlField[]>(`${this.baseUrl}/controls/fields`, {
      params: new HttpParams({ fromObject: { ...device } }),
    });
  }

  readValue(device: DeviceRef, fieldId: string): Observable<ControlValue> {
    return this.http.get<ControlValue>(`${this.baseUrl}/controls/fields/${encodeURIComponent(fieldId)}/value`, {
      params: new HttpParams({ fromObject: { ...device } }),
    });
  }

  writeValue(device: DeviceRef, fieldId: string, value: string): Observable<ControlWriteResult> {
    return this.http.put<ControlWriteResult>(`${this.baseUrl}/controls/fields/${encodeURIComponent(fieldId)}/value`, {
      device,
      value,
    });
  }

  preferredProfile(): Observable<{ steps: ProfileStep[] }> {
    return this.http.get<{ steps: ProfileStep[] }>(`${this.baseUrl}/controls/profiles/preferred`);
  }

  applyPreferredProfile(device: DeviceRef): Observable<ProfileResult> {
    return this.http.post<ProfileResult>(`${this.baseUrl}/controls/profiles/preferred`, { device });
  }
}
