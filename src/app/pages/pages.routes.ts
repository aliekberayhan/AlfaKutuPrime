import { Routes } from '@angular/router';
import { Documentation } from './documentation/documentation';
import { Crud } from './crud/crud';
import { Empty } from './empty/empty';
import { Fisler } from './fisler/fisler';
import { CustomerPage } from './customer/customer';
import { KalitePage } from './kalite/kalite';
import { PermissionGuard } from '../auth/permission.guard';
import { UsersComponent } from './users/users.component';
import { RolesComponent } from './roles/roles.component';

export default [
    { path: 'documentation', component: Documentation },
    { path: 'crud', component: Crud },
    { path: 'fisler', component: Fisler, canActivate: [PermissionGuard], data: { permission: 'Fis.View' } },
    { path: 'customer', component: CustomerPage, canActivate: [PermissionGuard], data: { permission: 'Customer.View' } },
    { path: 'kalite', component: KalitePage, canActivate: [PermissionGuard], data: { permission: 'Kalite.View' } },
    { path: 'roles', component: RolesComponent, canActivate: [PermissionGuard], data: { permission: 'Roles.View' } },
    { path: 'users', component: UsersComponent, canActivate: [PermissionGuard], data: { permission: 'Users.View' } },
    { path: 'empty', component: Empty },
    { path: '**', redirectTo: '/notfound' }
] as Routes;
