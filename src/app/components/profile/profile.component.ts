import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StorageService } from '../../services/storage.service';
import { UserService } from '../../services/user.service';
import { ToastService } from '../../services/toast.service';

@Component({
    selector: 'app-profile',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './profile.component.html'
})
export class ProfileComponent implements OnInit {
    currentUser: any;
    profileForm = {
        email: '',
        contactNumber: ''
    };
    selectedImageFile?: File;
    selectedImagePreview?: string;
    BASE_IMAGE_URL = 'http://localhost:8084';

    constructor(
        private storageService: StorageService,
        private userService: UserService,
        private toastService: ToastService
    ) { }

    ngOnInit(): void {
        this.currentUser = this.storageService.getUser();
        this.profileForm.email = this.currentUser.email;
        this.profileForm.contactNumber = this.currentUser.contactNumber || '';
        if (this.currentUser.imageUrl) {
            this.selectedImagePreview = this.BASE_IMAGE_URL + this.currentUser.imageUrl;
        }
    }

    onFileSelected(event: any): void {
        const file = event.target.files[0];
        if (file) {
            this.selectedImageFile = file;
            const reader = new FileReader();
            reader.onload = () => this.selectedImagePreview = reader.result as string;
            reader.readAsDataURL(file);
        }
    }

    updateProfile(): void {
        this.userService.updateProfile(this.profileForm).subscribe({
            next: (data: any) => {
                const updatedUser = { ...this.currentUser, ...data };
                this.storageService.saveUser(updatedUser);
                this.currentUser = updatedUser;

                if (this.selectedImageFile) {
                    this.userService.uploadUserImage(this.currentUser.id, this.selectedImageFile).subscribe({
                        next: (userData: any) => {
                            const finalUser = { ...this.currentUser, ...userData };
                            this.storageService.saveUser(finalUser);
                            this.currentUser = finalUser;
                            this.toastService.show('Identity details and profile image synchronized.', 'success');
                        },
                        error: () => this.toastService.show('Details updated, but image digitization failed.', 'warning')
                    });
                } else {
                    this.toastService.show('Identity details synchronized.', 'success');
                }
            },
            error: () => this.toastService.show('Failed to synchronize identity details', 'error')
        });
    }
}
