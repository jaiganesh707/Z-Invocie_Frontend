import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, tap, of } from 'rxjs';
import { FoodItem } from '../models/food-item.model';
import { DataCacheService } from './data-cache.service';
import { environment } from '../../environments/environment';

const API_URL = `${environment.apiUrl}/food-items`;

@Injectable({
    providedIn: 'root'
})
export class FoodItemService {
    private foodItemsSubject = new BehaviorSubject<FoodItem[]>([]);
    public foodItems$ = this.foodItemsSubject.asObservable();
    private readonly CACHE_KEY = 'food_items_list';

    constructor(
        private http: HttpClient,
        private cacheService: DataCacheService
    ) { }

    reloadAll(userId?: number): void {
        const cacheKey = userId ? `${this.CACHE_KEY}_${userId}` : this.CACHE_KEY;
        let url = API_URL;
        if (userId) {
            url += `?userId=${userId}`;
        }
        this.http.get<FoodItem[]>(url).subscribe({
            next: items => {
                this.cacheService.set(cacheKey, items);
                this.foodItemsSubject.next(items);
            },
            error: err => console.error('Failed to reload food items', err)
        });
    }

    getAll(userId?: number, forceRefresh: boolean = false): Observable<FoodItem[]> {
        const cacheKey = userId ? `${this.CACHE_KEY}_${userId}` : this.CACHE_KEY;
        const cachedData = this.cacheService.get<FoodItem[]>(cacheKey);

        if (cachedData && !forceRefresh) {
            this.foodItemsSubject.next(cachedData);
            return of(cachedData);
        }

        let url = API_URL;
        if (userId) {
            url += `?userId=${userId}`;
        }
        return this.http.get<FoodItem[]>(url).pipe(
            tap(items => {
                this.cacheService.set(cacheKey, items);
                this.foodItemsSubject.next(items);
            })
        );
    }

    create(data: FoodItem, userId?: number): Observable<FoodItem> {
        let url = API_URL;
        if (userId) {
            url += `?userId=${userId}`;
        }
        return this.http.post<FoodItem>(url, data).pipe(
            tap(newItem => {
                const currentItems = this.foodItemsSubject.value;
                const updatedItems = [...currentItems, newItem];
                this.foodItemsSubject.next(updatedItems);
                const cacheKey = userId ? `${this.CACHE_KEY}_${userId}` : this.CACHE_KEY;
                this.cacheService.set(cacheKey, updatedItems);
            })
        );
    }

    update(id: number, data: FoodItem, userId?: number): Observable<FoodItem> {
        return this.http.put<FoodItem>(`${API_URL}/${id}`, data).pipe(
            tap(updatedItem => {
                const currentItems = this.foodItemsSubject.value;
                const index = currentItems.findIndex(item => item.id === id);
                if (index !== -1) {
                    currentItems[index] = { ...currentItems[index], ...updatedItem };
                    const updatedItems = [...currentItems];
                    this.foodItemsSubject.next(updatedItems);
                    const cacheKey = userId ? `${this.CACHE_KEY}_${userId}` : this.CACHE_KEY;
                    this.cacheService.set(cacheKey, updatedItems);
                }
            })
        );
    }

    delete(id: number, userId?: number): Observable<any> {
        return this.http.delete(`${API_URL}/${id}`).pipe(
            tap(() => {
                const currentItems = this.foodItemsSubject.value;
                const updatedItems = currentItems.filter(item => item.id !== id);
                this.foodItemsSubject.next(updatedItems);
                const cacheKey = userId ? `${this.CACHE_KEY}_${userId}` : this.CACHE_KEY;
                this.cacheService.set(cacheKey, updatedItems);
            })
        );
    }

    uploadImage(id: number, file: File, userId?: number): Observable<FoodItem> {
        const formData = new FormData();
        formData.append('file', file);
        let url = `${API_URL}/${id}/image`;
        if (userId) {
            url += `?userId=${userId}`;
        }
        return this.http.post<FoodItem>(url, formData).pipe(
            tap(updatedItem => {
                const currentItems = this.foodItemsSubject.value;
                const index = currentItems.findIndex(item => item.id === id);
                if (index !== -1) {
                    currentItems[index] = { ...currentItems[index], ...updatedItem };
                    const updatedItems = [...currentItems];
                    this.foodItemsSubject.next(updatedItems);
                    const cacheKey = userId ? `${this.CACHE_KEY}_${userId}` : this.CACHE_KEY;
                    this.cacheService.set(cacheKey, updatedItems);
                }
            })
        );
    }
}
