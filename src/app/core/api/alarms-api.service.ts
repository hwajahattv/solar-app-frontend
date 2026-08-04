import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { EMPTY, expand, Observable, reduce } from 'rxjs';

import { Alarm, AlarmPage } from '../models/alarm.model';
import { DeviceRef } from '../models/device.model';
import { API_BASE_URL } from './api.config';

/** Backend AlarmQueryDto caps pageSize at 100. */
const ANALYSIS_PAGE_SIZE = 100;

@Injectable({ providedIn: 'root' })
export class AlarmsApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  list(device: DeviceRef, page = 0, pageSize = 10): Observable<AlarmPage> {
    return this.http.get<AlarmPage>(`${this.baseUrl}/alarms`, {
      params: new HttpParams({ fromObject: { ...device, page, pageSize } }),
    });
  }

  /**
   * Walks every page (max pageSize) until the gateway reports no more rows.
   * Used by the alarms analysis tables, which need the full history.
   */
  listAll(device: DeviceRef): Observable<Alarm[]> {
    return this.list(device, 0, ANALYSIS_PAGE_SIZE).pipe(
      expand((page) => {
        const nextPage = page.page + 1;
        const exhaustedPage = page.alarms.length < ANALYSIS_PAGE_SIZE;
        const reachedTotal = nextPage * page.pageSize >= page.total;
        if (exhaustedPage || reachedTotal || page.alarms.length === 0) {
          return EMPTY;
        }
        return this.list(device, nextPage, ANALYSIS_PAGE_SIZE);
      }),
      reduce((all, page) => all.concat(page.alarms), [] as Alarm[]),
    );
  }
}
