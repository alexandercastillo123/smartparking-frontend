import { Routes } from '@angular/router';
import { ProfileSettingsComponent } from './features/profile/pages/profile-settings/profile-settings.component';
import { HistoryPageComponent } from './features/profile/pages/history-page/history-page.component';
import { UserProfileComponent } from "./features/profile/pages/user-profile/user-profile.component";
import { ParkingAdminDashboardComponent } from "./features/administration/pages/parking-admin-dashboard/parking-admin-dashboard.component";
import { authGuard } from "./core/guards/auth.guard";
import { StudentDashboardComponent } from './features/student-dashboard/pages/student-dashboard/student-dashboard.component';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/iam/pages/login/login.page').then(m => m.LoginPageComponent)
  },
  {
    path: 'register',
    loadComponent: () => import('./features/iam/pages/register/register.page').then(m => m.RegisterPageComponent)
  },
  {
    path: 'password-recovery',
    loadComponent: () => import('./features/iam/pages/password-recovery/password-recovery.page').then(m => m.PasswordRecoveryPageComponent)
  },
  {
    path: 'password-recovery/new-password',
    loadComponent: () => import('./features/iam/pages/password-recovery-newpassword/password-recovery-newpassword.page').then(m => m.PasswordRecoveryNewpasswordPageComponent)
  },


  {
    path: 'profile',
    component: UserProfileComponent,
    canActivate: [authGuard]
  },
  {
    path: 'profile/notifications',
    component: ProfileSettingsComponent,
    canActivate: [authGuard]
  },
  {
    path: 'history',
    component: HistoryPageComponent,
    canActivate: [authGuard]
  },
  {
    path: 'new-dashboard',
    component: StudentDashboardComponent,
    canActivate: [authGuard]
  },
  {
    path: 'dashboard',
    loadChildren: () => import('./features/student-dashboard/student-dashboard.module').then(m => m.StudentDashboardModule),
    canActivate: [authGuard]
  },
  {
    path: 'admin/dashboard',
    component: ParkingAdminDashboardComponent,
    canActivate: [authGuard]
  },
  {
    path: 'admin/reports',
    loadComponent: () => import('./features/administration/pages/admin-reports/admin-reports.component').then(m => m.AdminReportsComponent),
    canActivate: [authGuard]
  },
  {
    path: '',
    redirectTo: '/login',
    pathMatch: 'full'
  },
  {
    path: '**',
    redirectTo: '/login'
  }
];
