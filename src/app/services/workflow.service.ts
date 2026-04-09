import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { WorkflowUser } from '../models/workflow-user.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class WorkflowService {
  private apiUrl = `${environment.apiUrl}/workflow`;

  constructor(private http: HttpClient) {}

  getSubUsers(parentId?: number): Observable<WorkflowUser[]> {
    const params: any = {};
    if (parentId) params['parentId'] = parentId.toString();
    return this.http.get<WorkflowUser[]>(`${this.apiUrl}/sub-users`, { params });
  }

  createSubUser(user: WorkflowUser, parentId?: number): Observable<WorkflowUser> {
    const params: any = {};
    if (parentId) params['parentId'] = parentId.toString();
    return this.http.post<WorkflowUser>(`${this.apiUrl}/sub-users`, user, { params });
  }

  updateSubUser(id: number, user: WorkflowUser): Observable<WorkflowUser> {
    return this.http.put<WorkflowUser>(`${this.apiUrl}/sub-users/${id}`, user);
  }

  deleteSubUser(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/sub-users/${id}`);
  }
}
