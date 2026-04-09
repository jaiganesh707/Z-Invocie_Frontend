import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { UserService } from '../../services/user.service';
import { StorageService } from '../../services/storage.service';
import { ToastService } from '../../services/toast.service';
import { AnalyticsDashboardComponent } from '../analytics-dashboard/analytics-dashboard.component';
import { Subscription, interval, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
    selector: 'app-board-super-admin',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule, AnalyticsDashboardComponent],
    templateUrl: './board-super-admin.component.html'
})
export class BoardSuperAdminComponent implements OnInit, OnDestroy {
    users: any[] = [];
    primeUsers: any[] = [];
    standardUsers: any[] = [];
    roles: any[] = [];
    form: any = {
        username: '',
        email: '',
        password: '',
        role: 'ROLE_USER'
    };
    isSuccessful = false;
    isAddFailed = false;
    errorMessage = '';
    isEditing = false;
    selectedUserId?: number;
    isPrimeUserCheck = false;

    private userSub?: Subscription;
    private roleSub?: Subscription;
    private destroy$ = new Subject<void>();

    constructor(
        private route: ActivatedRoute,
        private userService: UserService,
        private storageService: StorageService,
        private toastService: ToastService,
    ) { }

    ngOnInit(): void {
        const currentUser = this.storageService.getUser();

        // Initial data from Resolver
        const resolvedData = this.route.snapshot.data['data'];
        if (resolvedData) {
            // Filter: Only users created by SuperAdmin (parentUser is null) and exclude driver/sub-user roles
            this.users = resolvedData.users.filter((u: any) => 
                u.username !== currentUser?.username && 
                !u.parentUser && 
                ['ROLE_PRIME_USER', 'ROLE_USER', 'ROLE_ADMIN'].includes(u.role)
            );
            this.primeUsers = this.users.filter(u => u.role === 'ROLE_PRIME_USER');
            this.standardUsers = this.users.filter(u => u.role === 'ROLE_USER' || u.role === 'ROLE_ADMIN');
            this.roles = resolvedData.roles.filter((r: string) => 
                ['ROLE_USER', 'ROLE_ADMIN'].includes(r)
            );
        }

        this.fetchData();

        this.userSub = this.userService.users$.subscribe({
            next: users => {
                this.users = users.filter((u: any) => 
                    u.username !== currentUser?.username && 
                    !u.parentUser && 
                    ['ROLE_PRIME_USER', 'ROLE_USER', 'ROLE_ADMIN'].includes(u.role)
                );
                this.primeUsers = this.users.filter(u => u.role === 'ROLE_PRIME_USER');
                this.standardUsers = this.users.filter(u => u.role === 'ROLE_USER' || u.role === 'ROLE_ADMIN');
            }
        });
        this.roleSub = this.userService.roles$.subscribe({
            next: roles => this.roles = roles.filter(r => ['ROLE_USER', 'ROLE_ADMIN'].includes(r))
        });

        // Polling every 10 seconds for higher precision in Strategic Center
        interval(10000)
            .pipe(takeUntil(this.destroy$))
            .subscribe(() => this.fetchData());
    }

    fetchData(): void {
        this.userService.reloadUsers().subscribe();
        this.userService.reloadRoles().subscribe();
    }

    ngOnDestroy(): void {
        this.userSub?.unsubscribe();
        this.roleSub?.unsubscribe();
        this.destroy$.next();
        this.destroy$.complete();
    }

    editUser(user: any): void {
        this.isEditing = true;
        this.selectedUserId = user.id;
        this.isPrimeUserCheck = user.role === 'ROLE_PRIME_USER';
        this.form = {
            username: user.username,
            email: user.email,
            password: '', // Don't show old password
            role: user.role === 'ROLE_PRIME_USER' ? 'ROLE_USER' : user.role
        };
        // Scroll to form
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    deleteUser(id: number): void {
        if (confirm('Decommission this stakeholder permanently?')) {
            this.userService.deleteUser(id).subscribe({
                next: () => this.toastService.success('Stakeholder access terminated.'),
                error: (err: any) => this.toastService.error('Termination failed: ' + (err.error.message || 'Error'))
            });
        }
    }


    onAddUser(): void {
        const payload = { ...this.form };
        if (this.isPrimeUserCheck) {
            payload.role = 'ROLE_PRIME_USER';
        }

        if (this.isEditing && this.selectedUserId) {
            this.userService.updateUser(this.selectedUserId, payload).subscribe({
                next: () => {
                    this.toastService.success('Stakeholder credentials synchronized.');
                    this.resetForm();
                },
                error: (err: any) => {
                    this.errorMessage = err.error.message || 'Synchronization failed';
                    this.isAddFailed = true;
                }
            });
        } else {
            this.userService.createUser(payload).subscribe({
                next: (data: any) => {
                    this.toastService.success('Stakeholder credentials provisioned successfully.');
                    this.isSuccessful = true;
                    this.isAddFailed = false;
                    this.resetForm();
                },
                error: (err: any) => {
                    this.errorMessage = err.error.message || 'Provisioning failed';
                    this.isAddFailed = true;
                    this.isSuccessful = false;
                }
            });
        }
    }


    resetForm(): void {
        this.isEditing = false;
        this.selectedUserId = undefined;
        this.isPrimeUserCheck = false;
        this.isSuccessful = false;
        this.isAddFailed = false;
        this.errorMessage = '';
        this.form = { username: '', email: '', password: '', role: 'ROLE_USER' };
    }
}
