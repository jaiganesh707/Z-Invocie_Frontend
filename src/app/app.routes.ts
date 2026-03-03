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
    { path: 'user-billing/:userId', component: UserBillingComponent, canActivate: [AuthGuard], data: { expectedRole: 'ROLE_USER' } },
    { path: 'analytics', component: AnalyticsDashboardComponent, canActivate: [AuthGuard], data: { expectedRole: 'ROLE_SUPER_ADMIN' } },
    { path: 'analytics/:userId', component: AnalyticsDashboardComponent, canActivate: [AuthGuard], data: { expectedRole: 'ROLE_SUPER_ADMIN' } },
    { path: 'user-analytics/:userId', component: UserAnalyticsComponent, canActivate: [AuthGuard], data: { expectedRole: 'ROLE_USER' } },
    { path: 'stakeholder/:userId', loadComponent: () => import('./components/stakeholder-hub/stakeholder-hub.component').then(m => m.StakeholderHubComponent), canActivate: [AuthGuard], data: { expectedRole: 'ROLE_SUPER_ADMIN' } },
    { path: '', redirectTo: 'home', pathMatch: 'full' }
];
