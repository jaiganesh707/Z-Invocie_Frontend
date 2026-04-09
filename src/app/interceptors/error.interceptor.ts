import { Injectable } from '@angular/core';
import { HttpEvent, HttpInterceptor, HttpHandler, HttpRequest, HTTP_INTERCEPTORS, HttpErrorResponse } from '@angular/common/http';
import { catchError, Observable, throwError } from 'rxjs';
import { ToastService } from '../services/toast.service';

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
    constructor(private toastService: ToastService) { }

    intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        return next.handle(req).pipe(
            catchError((error: HttpErrorResponse) => {
                let errorMessage = 'An unknown error occurred!';
                if (error.error instanceof ErrorEvent) {
                    // Client-side error
                    errorMessage = `Error: ${error.error.message}`;
                } else if (error.error && error.error.message) {
                    // Server-side error (our custom JSON format)
                    errorMessage = error.error.message;
                } else {
                    // Server-side error (default generic)
                    errorMessage = `Transaction error [Code ${error.status}]: ${error.statusText}`;
                }

                this.toastService.error(errorMessage);
                console.error('Interception Error:', errorMessage);
                return throwError(() => error);
            })
        );
    }
}

export const errorInterceptorProviders = [
    { provide: HTTP_INTERCEPTORS, useClass: ErrorInterceptor, multi: true },
];
