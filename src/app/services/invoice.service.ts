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


    getAll(): Observable<Invoice[]> {
        return this.http.get<Invoice[]>(API_URL);
    }

    getByUser(userId: number, startDate?: string, endDate?: string): Observable<Invoice[]> {
        let params = '';
        if (startDate && endDate) {
            params = `?startDate=${startDate}&endDate=${endDate}`;
        }
        return this.http.get<Invoice[]>(`${API_URL}/user/${userId}${params}`);
    }
}
