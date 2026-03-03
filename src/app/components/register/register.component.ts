import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

import { ToastService } from '../../services/toast.service';

@Component({
    selector: 'app-register',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './register.component.html',
    styleUrls: ['./register.component.css']
})
export class RegisterComponent implements OnInit {
    form: any = {
        username: '',
        email: '',
        password: ''
    };
    isSuccessful = false;
    isSignUpFailed = false;

    constructor(
        private authService: AuthService,
        private toastService: ToastService
    ) { }

    ngOnInit(): void {
    }

    onSubmit(): void {
        const { username, email, password } = this.form;

        this.authService.register(username, email, password).subscribe({
            next: data => {
                this.isSuccessful = true;
                this.isSignUpFailed = false;
                this.toastService.success('Account created successfully! You can now login.');
            },
            error: err => {
                this.isSignUpFailed = true;
                // Toast service in interceptor will handle the common error message
            }
        });
    }
}
