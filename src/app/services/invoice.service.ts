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

    delete(id: number): Observable<any> {
        return this.http.delete(`${API_URL}/terminate/${id}`);
    }

    getPending(): Observable<Invoice[]> {
        return this.http.get<Invoice[]>(`${API_URL}/pending`);
    }

    approve(id: number, addOutstanding: boolean = false, paidAmount?: number): Observable<Invoice> {
        let url = `${API_URL}/${id}/approve?addOutstanding=${addOutstanding}`;
        if (paidAmount !== undefined && paidAmount !== null) {
            url += `&paidAmount=${paidAmount}`;
        }
        return this.http.post<Invoice>(url, {});
    }

    reject(id: number, reason: string): Observable<Invoice> {
        return this.http.post<Invoice>(`${API_URL}/${id}/reject`, reason);
    }

    markPending(id: number): Observable<Invoice> {
        return this.http.post<Invoice>(`${API_URL}/action-set-pending/${id}`, {});
    }

    getCustomerBalance(customerId: number): Observable<number> {
        return this.http.get<number>(`${API_URL}/customer/${customerId}/balance`);
    }

    assignDriver(id: number, driverUserId: number): Observable<Invoice> {
        return this.http.post<Invoice>(`${API_URL}/${id}/assign-driver`, driverUserId);
    }

    updateDeliveryStatus(id: number, status: string, amountCollected?: number): Observable<Invoice> {
        let url = `${API_URL}/${id}/delivery-status?status=${status}`;
        if (amountCollected !== undefined) {
            url += `&amountCollected=${amountCollected}`;
        }
        return this.http.post<Invoice>(url, {});
    }

    settle(id: number): Observable<Invoice> {
        return this.http.post<Invoice>(`${API_URL}/${id}/settle`, {});
    }

    updatePayment(id: number, amount: number): Observable<Invoice> {
        return this.http.post<Invoice>(`${API_URL}/${id}/pay?amount=${amount}`, {});
    }

    submitForApproval(id: number, note: string): Observable<Invoice> {
        return this.http.post<Invoice>(`${API_URL}/${id}/submit`, note, {
            headers: { 'Content-Type': 'text/plain' }
        });
    }
}
