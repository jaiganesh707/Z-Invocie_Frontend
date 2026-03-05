import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, tap, of } from 'rxjs';
import { environment } from '../../environments/environment';
import { DataCacheService } from './data-cache.service';

const API_URL = `${environment.apiUrl}/expenses`;

@Injectable({
    providedIn: 'root'
})
export class ExpenseService {
    private expensesSubject = new BehaviorSubject<any[]>([]);
    public expenses$ = this.expensesSubject.asObservable();
    private readonly CACHE_KEY = 'expenses_list';

    constructor(
        private http: HttpClient,
        private cacheService: DataCacheService
    ) {
        this.reloadAll();
    }

    reloadAll(): void {
        this.http.get<any[]>(API_URL).subscribe({
            next: expenses => {
                this.cacheService.set(this.CACHE_KEY, expenses);
                this.expensesSubject.next(expenses);
            },
            error: err => console.error('Failed to reload expenses', err)
        });
    }

    getAll(forceRefresh: boolean = false): Observable<any[]> {
        const cachedData = this.cacheService.get<any[]>(this.CACHE_KEY);
        if (cachedData && !forceRefresh) {
            this.expensesSubject.next(cachedData);
            return of(cachedData);
        }
        return this.http.get<any[]>(API_URL).pipe(
            tap(expenses => {
                this.cacheService.set(this.CACHE_KEY, expenses);
                this.expensesSubject.next(expenses);
            })
        );
    }

    create(data: any): Observable<any> {
        return this.http.post<any>(API_URL, data).pipe(
            tap(newExpense => {
                const currentExpenses = this.expensesSubject.value;
                const updatedExpenses = [...currentExpenses, newExpense];
                this.expensesSubject.next(updatedExpenses);
                this.cacheService.set(this.CACHE_KEY, updatedExpenses);
            })
        );
    }

    delete(id: number): Observable<any> {
        return this.http.delete(`${API_URL}/${id}`).pipe(
            tap(() => {
                const currentExpenses = this.expensesSubject.value;
                const updatedExpenses = currentExpenses.filter(e => e.id !== id);
                this.expensesSubject.next(updatedExpenses);
                this.cacheService.set(this.CACHE_KEY, updatedExpenses);
            })
        );
    }
}
