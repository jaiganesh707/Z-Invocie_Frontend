import { Injectable } from '@angular/core';

interface CacheEntry<T> {
    data: T;
    expiry: number;
}

@Injectable({
    providedIn: 'root'
})
export class DataCacheService {
    private cache = new Map<string, CacheEntry<any>>();
    private readonly DEFAULT_TTL = 300000; // 5 minutes in milliseconds

    set<T>(key: string, data: T, ttl: number = this.DEFAULT_TTL): void {
        const expiry = Date.now() + ttl;
        this.cache.set(key, { data, expiry });
    }

    get<T>(key: string): T | null {
        const entry = this.cache.get(key);
        if (!entry) return null;

        if (Date.now() > entry.expiry) {
            this.cache.delete(key);
            return null;
        }

        return entry.data;
    }

    clear(key?: string): void {
        if (key) {
            this.cache.delete(key);
        } else {
            this.cache.clear();
        }
    }
}
