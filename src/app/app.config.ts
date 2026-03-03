import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

import { routes } from './app.routes';
import { httpInterceptorProviders } from './interceptors/auth.interceptor';
import { errorInterceptorProviders } from './interceptors/error.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(withInterceptorsFromDi()),
    httpInterceptorProviders,
    errorInterceptorProviders
  ]
};
