import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface DriverDetails {
  userId?: number;
  name?: string;
  email?: string;
  contactNumber?: string;
  age?: number;
  bikeNo?: string;
  licenseNumber?: string;
  licensePhoto?: string;
  driverPhoto?: string;
  address?: string;
  route?: string;
}

@Injectable({
  providedIn: 'root'
})
export class DriverService {
  private apiUrl = `${environment.apiUrl}/drivers`;

  constructor(private http: HttpClient) { }

  updateDetails(details: DriverDetails): Observable<any> {
    return this.http.post(`${this.apiUrl}/details`, details);
  }

  registerDriver(details: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/register-driver`, details);
  }

  getMyDetails(): Observable<DriverDetails> {
    return this.http.get<DriverDetails>(`${this.apiUrl}/me`);
  }

  getAllDrivers(): Observable<DriverDetails[]> {
    return this.http.get<DriverDetails[]>(`${this.apiUrl}/all`);
  }

  getByParent(): Observable<DriverDetails[]> {
    return this.http.get<DriverDetails[]>(`${this.apiUrl}/by-parent`);
  }

  uploadLicense(userId: number, file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post(`${this.apiUrl}/${userId}/license`, formData);
  }

  uploadPhoto(userId: number, file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post(`${this.apiUrl}/${userId}/photo`, formData);
  }
}
