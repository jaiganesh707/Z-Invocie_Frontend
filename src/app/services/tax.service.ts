import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface CustomTax {
  id?: number;
  userId: number;
  name: string;
  percentage: number;
  description: string;
  isActive: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class TaxService {
  private apiUrl = `${environment.apiUrl}/taxes`;

  constructor(private http: HttpClient) { }

  create(userId: number, tax: CustomTax): Observable<CustomTax> {
    return this.http.post<CustomTax>(`${this.apiUrl}?userId=${userId}`, tax);
  }

  getAllForUser(userId: number): Observable<CustomTax[]> {
    return this.http.get<CustomTax[]>(`${this.apiUrl}?userId=${userId}`);
  }

  update(id: number, userId: number, tax: CustomTax): Observable<CustomTax> {
    return this.http.put<CustomTax>(`${this.apiUrl}/${id}?userId=${userId}`, tax);
  }

  delete(id: number, userId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}?userId=${userId}`);
  }

  getActiveTaxes(userId: number): Observable<CustomTax[]> {
    return this.http.get<CustomTax[]>(`${this.apiUrl}/active/${userId}`);
  }
}
