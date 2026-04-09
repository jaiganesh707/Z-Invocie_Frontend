import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export enum DeliveryStatus {
  PENDING = 'PENDING',
  ASSIGNED = 'ASSIGNED',
  PICKED_UP = 'PICKED_UP',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED'
}

export interface DeliveryOrder {
  id?: number;
  customerId?: number;
  driverId?: number;
  shopName: string;
  shopDetails: string;
  pickupMessage: string;
  status?: DeliveryStatus;
}

@Injectable({
  providedIn: 'root'
})
export class DeliveryOrderService {
  private apiUrl = `${environment.apiUrl}/delivery-orders`;

  constructor(private http: HttpClient) { }

  createOrder(order: DeliveryOrder): Observable<any> {
    return this.http.post(`${this.apiUrl}/create`, order);
  }

  getDriverOrders(): Observable<DeliveryOrder[]> {
    return this.http.get<DeliveryOrder[]>(`${this.apiUrl}/driver`);
  }

  getCustomerOrders(): Observable<DeliveryOrder[]> {
    return this.http.get<DeliveryOrder[]>(`${this.apiUrl}/customer`);
  }

  updateStatus(id: number, status: DeliveryStatus): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${id}/status?status=${status}`, {});
  }
}
