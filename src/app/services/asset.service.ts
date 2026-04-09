import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BusinessAsset } from '../models/business-asset.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AssetService {
  private apiUrl = `${environment.apiUrl}/api/assets`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<BusinessAsset[]> {
    return this.http.get<BusinessAsset[]>(this.apiUrl);
  }

  create(asset: BusinessAsset): Observable<BusinessAsset> {
    return this.http.post<BusinessAsset>(this.apiUrl, asset);
  }

  update(id: number, asset: BusinessAsset): Observable<BusinessAsset> {
    return this.http.put<BusinessAsset>(`${this.apiUrl}/${id}`, asset);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
