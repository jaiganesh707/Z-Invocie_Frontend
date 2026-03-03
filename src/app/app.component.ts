import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterOutlet, Router, RouterModule } from '@angular/router';
import { StorageService } from './services/storage.service';
import { AuthService } from './services/auth.service';
import { UserService } from './services/user.service';
import { Subscription } from 'rxjs';

import { ToastComponent } from './components/toast/toast.component';

@Component({
    selector: 'app-root',
    standalone: true,
    imports: [CommonModule, RouterOutlet, RouterModule, ToastComponent],
    templateUrl: './app.component.html',
    styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
    private role: string | null = null;
    isLoggedIn = false;
    showSuperAdminBoard = false;
    isSidebarActive = false;
    username?: string;
    userId?: number;
    private authSubscription?: Subscription;

    constructor(
        private storageService: StorageService,
        private authService: AuthService,
        private userService: UserService,
        private router: Router
    ) { }

    ngOnInit(): void {
        this.authSubscription = this.authService.currentUser$.subscribe(user => {
            this.isLoggedIn = !!user;

            if (user) {
                this.role = user.role;
                this.showSuperAdminBoard = this.role === 'ROLE_SUPER_ADMIN';
                this.username = user.username;
                this.userId = user.id;
            } else {
                this.role = null;
                this.showSuperAdminBoard = false;
                this.username = undefined;
                this.userId = undefined;
            }
        });
    }

    ngOnDestroy(): void {
        if (this.authSubscription) {
            this.authSubscription.unsubscribe();
        }
    }

    logout(): void {
        this.storageService.clean();
        this.authService.clearCurrentUser();
        this.router.navigate(['/home']);
    }

    refreshAuthority(): void {
        // Force a data refresh in the background if already on the admin page
        if (this.router.url === '/super-admin') {
            this.userService.reloadUsers().subscribe();
            this.userService.reloadRoles().subscribe();
        }
    }
}
