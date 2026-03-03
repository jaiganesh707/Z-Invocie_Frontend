import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

const API_URL = `${environment.apiUrl}/analytics`;

@Injectable({
    providedIn: 'root'
})
export class AnalyticsService {
    constructor(private http: HttpClient) { }

    getUserStats(period: string = 'day'): Observable<any> {
        return this.http.get<any>(`${API_URL}/users?period=${period}`);
    }

    getBillingAnalytics(userId: number): Observable<any> {
        return this.http.get<any>(`${API_URL}/billing/${userId}`);
    }

    getStakeholderPerformance(): Observable<any[]> {
        return this.http.get<any[]>(`${API_URL}/performance`);
    }
}
