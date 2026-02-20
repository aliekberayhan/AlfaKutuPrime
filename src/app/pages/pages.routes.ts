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
import { MuhasebeComponent } from './muhasebe/muhasebe.component';
import { CustomerSampleComponent } from './customer/sample.component';
import { KaliteComponent } from './kalite/kalite.component';
import { CustomersComponent } from './customers/customers.component';

export default [
    { path: 'documentation', component: Documentation },
    { path: 'crud', component: Crud },
    { path: 'fisler', component: Fisler, canActivate: [PermissionGuard], data: { permission: 'Fis.View' } },
    { path: 'customer', component: CustomerPage, canActivate: [PermissionGuard], data: { permission: 'Customer.View' } },
    { path: 'kalite', component: KalitePage, canActivate: [PermissionGuard], data: { permission: 'Kalite.View' } },
    { path: 'muhasebe', component: MuhasebeComponent, canActivate: [PermissionGuard], data: { permission: 'Samples.Manage' } },
    { path: 'customer-samples', component: CustomerSampleComponent, canActivate: [PermissionGuard], data: { permission: 'Samples.Create' } },
    { path: 'kalite-samples', component: KaliteComponent, canActivate: [PermissionGuard], data: { permission: 'Kalite.View' } },
    { path: 'roles', component: RolesComponent, canActivate: [PermissionGuard], data: { permission: 'Roles.View' } },
    { path: 'users', component: UsersComponent, canActivate: [PermissionGuard], data: { permission: 'Users.View' } },
    { path: 'customers', component: CustomersComponent, canActivate: [PermissionGuard], data: { permission: 'Customers.Manage' } },
    { path: 'empty', component: Empty },
    { path: '**', redirectTo: '/notfound' }
] as Routes;
