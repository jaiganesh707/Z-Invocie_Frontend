import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { StorageService } from './storage.service';
import { environment } from '../../environments/environment';

const AUTH_API = `${environment.apiUrl}/auth/`;

const httpOptions = {
    headers: new HttpHeaders({ 'Content-Type': 'application/json' })
};

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private currentUserSubject: BehaviorSubject<any>;
    public currentUser$: Observable<any>;

    constructor(private http: HttpClient, private storageService: StorageService) {
        this.currentUserSubject = new BehaviorSubject<any>(this.storageService.getUser());
        this.currentUser$ = this.currentUserSubject.asObservable();
    }

    setCurrentUser(user: any): void {
        this.currentUserSubject.next(user);
    }

    clearCurrentUser(): void {
        this.currentUserSubject.next(null);
    }

    login(username: string, password: string): Observable<any> {
        return this.http.post(
            AUTH_API + 'login',
            {
                username,
                password
            },
            httpOptions
        );
    }

    register(username: string, email: string, password: string): Observable<any> {
        return this.http.post(
            AUTH_API + 'signup',
            {
                username,
                email,
                password
            },
            httpOptions
        );
    }

    logout(): Observable<any> {
        return this.http.post(AUTH_API + 'signout', {}, httpOptions);
    }

    refreshToken(token: string) {
        return this.http.post(AUTH_API + 'refreshtoken', {
            refreshToken: token
        }, httpOptions);
    }
}
