import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, tap, of } from 'rxjs';
import { Employee } from '../models/employee.model';
import { environment } from '../../environments/environment';

const API_URL = `${environment.apiUrl}/employees`;

@Injectable({
    providedIn: 'root'
})
export class EmployeeService {
    private employeesSubject = new BehaviorSubject<Employee[]>([]);
    public employees$ = this.employeesSubject.asObservable();
    
    private http = inject(HttpClient);

    getAll(userId: number): Observable<Employee[]> {
        return this.http.get<Employee[]>(`${API_URL}?userId=${userId}`).pipe(
            tap(items => this.employeesSubject.next(items))
        );
    }

    create(data: Employee, userId: number): Observable<Employee> {
        return this.http.post<Employee>(`${API_URL}?userId=${userId}`, data).pipe(
            tap(newItem => {
                const current = this.employeesSubject.value;
                this.employeesSubject.next([...current, newItem]);
            })
        );
    }

    update(id: number, data: Employee, userId: number): Observable<Employee> {
        return this.http.put<Employee>(`${API_URL}/${id}?userId=${userId}`, data).pipe(
            tap(updated => {
                const current = this.employeesSubject.value;
                const idx = current.findIndex(e => e.id === id);
                if (idx !== -1) {
                    current[idx] = updated;
                    this.employeesSubject.next([...current]);
                }
            })
        );
    }

    delete(id: number, userId: number): Observable<any> {
        return this.http.delete(`${API_URL}/${id}?userId=${userId}`).pipe(
            tap(() => {
                const current = this.employeesSubject.value;
                this.employeesSubject.next(current.filter(e => e.id !== id));
            })
        );
    }

    uploadImage(id: number, file: File, userId: number): Observable<Employee> {
        const formData = new FormData();
        formData.append('file', file);
        return this.http.post<Employee>(`${API_URL}/${id}/image?userId=${userId}`, formData).pipe(
            tap(updated => {
                const current = this.employeesSubject.value;
                const idx = current.findIndex(e => e.id === id);
                if (idx !== -1) {
                    current[idx] = updated;
                    this.employeesSubject.next([...current]);
                }
            })
        );
    }
}
