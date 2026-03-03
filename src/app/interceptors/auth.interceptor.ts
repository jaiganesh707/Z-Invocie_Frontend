import { Injectable } from '@angular/core';
import { HttpEvent, HttpInterceptor, HttpHandler, HttpRequest, HTTP_INTERCEPTORS, HttpErrorResponse } from '@angular/common/http';
import { catchError, Observable, throwError } from 'rxjs';
import { StorageService } from '../services/storage.service';
import { Router } from '@angular/router';

import { ToastService } from '../services/toast.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
    constructor(
        private storageService: StorageService,
        private router: Router,
        private toastService: ToastService
    ) { }

    intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        let authReq = req;
        const token = this.storageService.getToken();
        if (token != null) {
            authReq = req.clone({ headers: req.headers.set('Authorization', 'Bearer ' + token) });
        }

        return next.handle(authReq).pipe(
            catchError((error: HttpErrorResponse) => {
                let errorMessage = 'An unexpected error occurred.';

                if (error.error && typeof error.error === 'object') {
                    errorMessage = error.error.message || errorMessage;
                } else if (typeof error.error === 'string') {
                    errorMessage = error.error;
                }

                if (error.status === 401) {
                    this.toastService.error(errorMessage || 'Session expired. Please login again.');
                    this.storageService.clean();
                    this.router.navigate(['/login']);
                } else if (error.status === 403) {
                    this.toastService.error(errorMessage || 'Access Denied: You do not have permission.');
                } else if (error.status === 0) {
                    this.toastService.error('Network error: Server is unreachable.');
                } else {
                    this.toastService.error(errorMessage);
                }
                return throwError(() => error);
            })
        );
    }
}

export const httpInterceptorProviders = [
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
];
