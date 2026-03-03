import { Injectable } from '@angular/core';
import { Router, CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree } from '@angular/router';
import { StorageService } from '../services/storage.service';
import { ToastService } from '../services/toast.service';

@Injectable({
    providedIn: 'root'
})
export class AuthGuard implements CanActivate {
    constructor(
        private router: Router,
        private storageService: StorageService,
        private toastService: ToastService
    ) { }

    canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean | UrlTree {
        const user = this.storageService.getUser();
        if (user) {
            // Check if route is restricted by role
            const expectedRole = route.data['expectedRole'];

            if (expectedRole && user.role !== expectedRole && user.role !== 'ROLE_SUPER_ADMIN') {
                // Role not authorized, redirect to home or user portal
                this.toastService.error('Unauthorized Access: You do not have the required authority for this terminal.');
                return this.router.parseUrl(user.role === 'ROLE_SUPER_ADMIN' ? '/super-admin' : '/user');
            }

            // Authorized, so return true
            return true;
        }

        // Not logged in, so redirect to login page with the return url
        this.toastService.error('Session Required: Please authenticate to access this terminal.');
        return this.router.parseUrl('/login');
    }
}
