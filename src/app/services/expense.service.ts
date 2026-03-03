import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, tap } from 'rxjs';
import { environment } from '../../environments/environment';

const API_URL = `${environment.apiUrl}/expenses`;

@Injectable({
    providedIn: 'root'
})
export class ExpenseService {
    private expensesSubject = new BehaviorSubject<any[]>([]);
    public expenses$ = this.expensesSubject.asObservable();

    constructor(private http: HttpClient) {
        this.reloadAll();
    }

    reloadAll(): void {
        this.http.get<any[]>(API_URL).subscribe({
            next: expenses => this.expensesSubject.next(expenses),
            error: err => console.error('Failed to reload expenses', err)
        });
    }

    create(data: any): Observable<any> {
        return this.http.post<any>(API_URL, data).pipe(
            tap(() => this.reloadAll())
        );
    }

    delete(id: number): Observable<any> {
        return this.http.delete(`${API_URL}/${id}`).pipe(
            tap(() => this.reloadAll())
        );
    }
}
