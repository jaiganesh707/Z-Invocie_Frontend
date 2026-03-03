import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { StorageService } from '../../services/storage.service';
import { Router } from '@angular/router';

import { ToastService } from '../../services/toast.service';

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
    form: any = {
        username: '',
        password: ''
    };
    isLoggedIn = false;
    isLoginFailed = false;
    roles: string[] = [];

    constructor(
        private authService: AuthService,
        private storageService: StorageService,
        private router: Router,
        private toastService: ToastService
    ) { }

    ngOnInit(): void {
        if (this.storageService.isLoggedIn()) {
            this.isLoggedIn = true;
            this.roles = this.storageService.getUser().role;
        }
    }

    onSubmit(): void {
        const { username, password } = this.form;

        this.authService.login(username, password).subscribe({
            next: data => {
                this.storageService.saveToken(data.token);
                this.storageService.saveRefreshToken(data.refreshToken);
                this.storageService.saveUser(data);

                this.isLoginFailed = false;
                this.isLoggedIn = true;
                this.roles = data.role;
                this.authService.setCurrentUser(data);
                this.toastService.success('Login successful! Welcome back.');

                if (data.role === 'ROLE_SUPER_ADMIN') {
                    this.router.navigate(['/super-admin']);
                } else {
                    this.router.navigate(['/home']);
                }
            },
            error: err => {
                this.isLoginFailed = true;
                // Toast service in interceptor will handle the common error message
            }
        });
    }


}
