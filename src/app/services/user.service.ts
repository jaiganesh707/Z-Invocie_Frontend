import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, tap, shareReplay, catchError, of } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class UserService {
    private BASE_URL = environment.apiUrl;

    private usersSubject = new BehaviorSubject<any[]>([]);
    public users$ = this.usersSubject.asObservable().pipe(shareReplay(1));

    private rolesSubject = new BehaviorSubject<any[]>([]);
    public roles$ = this.rolesSubject.asObservable().pipe(shareReplay(1));

    constructor(private http: HttpClient) { }

    reloadUsers(): Observable<any[]> {
        return this.http.get<any[]>(this.BASE_URL + '/users').pipe(
            tap(users => this.usersSubject.next(users)),
            catchError(err => {
                console.error('Failed to reload users', err);
                return of(this.usersSubject.value);
            }),
            shareReplay(1)
        );
    }

    reloadRoles(): Observable<any[]> {
        return this.http.get<any[]>(this.BASE_URL + '/roles').pipe(
            tap(roles => this.rolesSubject.next(roles)),
            catchError(err => {
                console.error('Failed to reload roles', err);
                return of(this.rolesSubject.value);
            }),
            shareReplay(1)
        );
    }

    getPublicContent(): Observable<any> {
        return this.http.get(this.BASE_URL + '/all', { responseType: 'text' });
    }

    getUserBoard(): Observable<any> {
        return this.http.get(this.BASE_URL + '/users/me');
    }

    getUserById(id: number): Observable<any> {
        return this.http.get(`${this.BASE_URL}/users/${id}`);
    }

    createUser(user: any): Observable<any> {
        return this.http.post(this.BASE_URL + '/users', user).pipe(
            tap(() => this.reloadUsers().subscribe())
        );
    }

    updateUser(id: number, user: any): Observable<any> {
        return this.http.put(`${this.BASE_URL}/users/${id}`, user).pipe(
            tap(() => this.reloadUsers().subscribe())
        );
    }

    deleteUser(id: number): Observable<any> {
        return this.http.delete(`${this.BASE_URL}/users/${id}`).pipe(
            tap(() => this.reloadUsers().subscribe())
        );
    }

    uploadUserImage(id: number, file: File): Observable<any> {
        const formData = new FormData();
        formData.append('file', file);
        return this.http.post(`${this.BASE_URL}/users/${id}/image`, formData).pipe(
            tap(() => this.reloadUsers().subscribe())
        );
    }

    updateProfile(data: any): Observable<any> {
        return this.http.put(this.BASE_URL + '/users/me/profile', data);
    }
}
