import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CreateInvoiceDto, Invoice } from '../models/invoice.model';
import { environment } from '../../environments/environment';

const API_URL = `${environment.apiUrl}/invoices`;

@Injectable({
    providedIn: 'root'
})
export class InvoiceService {
    constructor(private http: HttpClient) { }

    create(data: CreateInvoiceDto): Observable<Invoice> {
        return this.http.post<Invoice>(API_URL, data);
    }

    getByUser(userId: number): Observable<Invoice[]> {
        return this.http.get<Invoice[]>(`${API_URL}/user/${userId}`);
    }

    getAll(): Observable<Invoice[]> {
        return this.http.get<Invoice[]>(API_URL);
    }
}
