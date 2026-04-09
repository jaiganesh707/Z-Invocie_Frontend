import { Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { LoginComponent } from './components/login/login.component';
import { ProfileComponent } from './components/profile/profile.component';

import { BoardSuperAdminComponent } from './components/board-super-admin/board-super-admin.component';
import { UserBillingComponent } from './components/user-billing/user-billing.component';
import { AnalyticsDashboardComponent } from './components/analytics-dashboard/analytics-dashboard.component';
import { UserAnalyticsComponent } from './components/user-analytics/user-analytics';
import { AuthGuard } from './guards/auth.guard';
import { boardDataResolver } from './board-data.resolver';

export const routes: Routes = [
    { path: 'home', component: HomeComponent },
    { path: 'login', component: LoginComponent },
    { path: 'profile', component: ProfileComponent, canActivate: [AuthGuard] },

    {
        path: 'super-admin',
        component: BoardSuperAdminComponent,
        canActivate: [AuthGuard],
        resolve: { data: boardDataResolver },
        data: { expectedRole: 'ROLE_SUPER_ADMIN' }
    },
    { path: 'user-billing/:userId', component: UserBillingComponent, canActivate: [AuthGuard] },
    { path: 'analytics', component: AnalyticsDashboardComponent, canActivate: [AuthGuard], data: { expectedRole: 'ROLE_SUPER_ADMIN' } },
    { path: 'analytics/:userId', component: AnalyticsDashboardComponent, canActivate: [AuthGuard], data: { expectedRole: 'ROLE_SUPER_ADMIN' } },
    { path: 'user-analytics/:userId', component: UserAnalyticsComponent, canActivate: [AuthGuard], data: { expectedRole: 'ROLE_USER' } },
    { path: 'stakeholder/:userId', loadComponent: () => import('./components/stakeholder-hub/stakeholder-hub.component').then(m => m.StakeholderHubComponent), canActivate: [AuthGuard] },
    { 
        path: 'driver-dashboard', 
        loadComponent: () => import('./components/driver-dashboard/driver-dashboard.component').then(m => m.DriverDashboardComponent), 
        canActivate: [AuthGuard], 
        data: { expectedRole: 'ROLE_DRIVER' } 
    },
    { 
        path: 'prime-dashboard', 
        loadComponent: () => import('./components/prime-dashboard/prime-dashboard.component').then(m => m.PrimeDashboardComponent), 
        canActivate: [AuthGuard], 
        data: { expectedRole: 'ROLE_PRIME_USER' } 
    },
    { 
        path: 'invoices', 
        loadComponent: () => import('./components/invoices/invoices').then(m => m.Invoices), 
        canActivate: [AuthGuard], 
        data: { expectedRole: ['ROLE_PRIME_USER', 'ROLE_WORKFLOW_USER', 'ROLE_APPROVER', 'ROLE_OPERATIONS', 'ROLE_MANAGEMENT'] } 
    },
    { 
        path: 'create-invoice', 
        loadComponent: () => import('./components/invoice-form/invoice-form.component').then(m => m.InvoiceFormComponent), 
        canActivate: [AuthGuard], 
        data: { expectedRole: ['ROLE_PRIME_USER', 'ROLE_WORKFLOW_USER', 'ROLE_APPROVER', 'ROLE_OPERATIONS'] } 
    },
    { 
        path: 'taxes', 
        loadComponent: () => import('./components/tax-management/tax-management.component').then(m => m.TaxManagementComponent), 
        canActivate: [AuthGuard], 
        data: { expectedRole: 'ROLE_PRIME_USER' } 
    },
    { 
        path: 'customers', 
        loadComponent: () => import('./components/customer-management/customer-management.component').then(m => m.CustomerManagementComponent), 
        canActivate: [AuthGuard], 
        data: { expectedRole: 'ROLE_PRIME_USER' } 
    },
    { 
        path: 'workflow', 
        loadComponent: () => import('./components/workflow-management/workflow-management.component').then(m => m.WorkflowManagementComponent), 
        canActivate: [AuthGuard], 
        data: { expectedRole: 'ROLE_PRIME_USER' } 
    },
    { 
        path: 'workflow-dashboard', 
        loadComponent: () => import('./components/workflow-dashboard/workflow-dashboard.component').then(m => m.WorkflowDashboardComponent), 
        canActivate: [AuthGuard], 
        data: { expectedRole: ['ROLE_WORKFLOW_USER', 'ROLE_PRIME_USER', 'ROLE_APPROVER'] } 
    },
    { 
        path: 'products', 
        loadComponent: () => import('./components/products/products').then(m => m.Products), 
        canActivate: [AuthGuard], 
        data: { expectedRole: ['ROLE_PRIME_USER', 'ROLE_WORKFLOW_USER'] } 
    },
    { 
        path: 'approval', 
        loadComponent: () => import('./components/approval-terminal/approval-terminal.component').then(m => m.ApprovalTerminalComponent), 
        canActivate: [AuthGuard], 
        data: { expectedRole: ['ROLE_PRIME_USER', 'ROLE_APPROVER', 'ROLE_MANAGEMENT', 'ROLE_SUPERVISOR'] } 
    },
    { 
        path: 'hr-hub', 
        loadComponent: () => import('./components/hr-hub/hr-hub').then(m => m.HRHubComponent), 
        canActivate: [AuthGuard], 
        data: { expectedRole: ['ROLE_PRIME_USER', 'ROLE_HR'] } 
    },
    { 
        path: 'chef-employees', 
        loadComponent: () => import('./components/hr-hub/hr-hub').then(m => m.HRHubComponent), 
        canActivate: [AuthGuard], 
        data: { expectedRole: ['ROLE_PRIME_USER', 'ROLE_HR'], filterHeads: true } 
    },
    { path: '', redirectTo: 'home', pathMatch: 'full' },
    { path: '**', redirectTo: 'home' }
];
