import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { DataCacheService } from './data-cache.service';

const API_URL = `${environment.apiUrl}/analytics`;

@Injectable({
    providedIn: 'root'
})
export class AnalyticsService {
    private readonly CACHE_TTL = 60000; // 1 minute

    constructor(
        private http: HttpClient,
        private cacheService: DataCacheService
    ) { }

    getUserStats(period: string = 'day'): Observable<any> {
        const cacheKey = `analytics_user_stats_${period}`;
        const cached = this.cacheService.get(cacheKey);
        if (cached) return of(cached);

        return this.http.get<any>(`${API_URL}/users?period=${period}`).pipe(
            tap(data => this.cacheService.set(cacheKey, data, this.CACHE_TTL))
        );
    }

    getBillingAnalytics(userId: number): Observable<any> {
        const cacheKey = `analytics_billing_${userId}`;
        const cached = this.cacheService.get(cacheKey);
        if (cached) return of(cached);

        return this.http.get<any>(`${API_URL}/billing/${userId}`).pipe(
            tap(data => this.cacheService.set(cacheKey, data, this.CACHE_TTL))
        );
    }

    getStakeholderPerformance(): Observable<any[]> {
        const cacheKey = `analytics_performance`;
        const cached = this.cacheService.get<any[]>(cacheKey);
        if (cached) return of(cached);

        return this.http.get<any[]>(`${API_URL}/performance`).pipe(
            tap(data => this.cacheService.set(cacheKey, data, this.CACHE_TTL))
        );
    }
}
