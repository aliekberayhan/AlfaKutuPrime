import { Routes } from '@angular/router';
import { Documentation } from './documentation/documentation';
import { Dashboard } from './dashboard/dashboard';
import { Crud } from './crud/crud';
import { Empty } from './empty/empty';
import { Fisler } from './fisler/fisler';
import { CustomerPage } from './customer/customer';
import { KaliteComponent } from './kalite/kalite.component';
import { PermissionGuard } from '../auth/permission.guard';
import { UsersComponent } from './users/users.component';
import { RolesComponent } from './roles/roles.component';
import { MuhasebeComponent } from './muhasebe/muhasebe.component';
import { CustomerSampleComponent } from './customer/sample.component';
import { CustomersComponent } from './customers/customers.component';
import { JiraComponent } from './jira/jira.component';
import { CustomerComplaintsComponent } from './customer-complaints/customer-complaints.component';
import { QualityComplaintsComponent } from './quality-complaints/quality-complaints.component';
import { CustomerOrdersComponent } from './customer/customer-orders.component';
import { SalesOrdersComponent } from './sales/sales-orders.component';
import { KaliteOrdersComponent } from './kalite/kalite-orders.component';

export default [
    { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    { path: 'dashboard', component: Dashboard },
    { path: 'documentation', component: Documentation },
    { path: 'crud', component: Crud },
    { path: 'fisler', component: Fisler, canActivate: [PermissionGuard], data: { permission: 'Fis.View' } },
    { path: 'customer', component: CustomerPage, canActivate: [PermissionGuard], data: { permission: 'Customer.View' } },
    { path: 'kalite', component: KaliteComponent, canActivate: [PermissionGuard], data: { permission: 'Kalite.View' } },
    { path: 'muhasebe', component: MuhasebeComponent, canActivate: [PermissionGuard], data: { permission: 'Samples.Manage' } },
    { path: 'customer-samples', component: CustomerSampleComponent, canActivate: [PermissionGuard], data: { permission: 'Samples.Create' } },
    { path: 'customer-complaints', component: CustomerComplaintsComponent, canActivate: [PermissionGuard], data: { permission: 'Complaints.View' } },
    { path: 'customer-orders', component: CustomerOrdersComponent, canActivate: [PermissionGuard], data: { permission: 'Orders.Create' } },
    { path: 'kalite-samples', component: KaliteComponent, canActivate: [PermissionGuard], data: { permission: 'Kalite.View' } },
    { path: 'quality-complaints', component: QualityComplaintsComponent, canActivate: [PermissionGuard], data: { permission: 'Complaints.Manage' } },
    { path: 'quality-orders', component: KaliteOrdersComponent, canActivate: [PermissionGuard], data: { permission: 'Orders.View' } },
    { path: 'sales-orders', component: SalesOrdersComponent, canActivate: [PermissionGuard], data: { permission: 'Orders.Approve' } },
    { path: 'orders', loadComponent: () => import('./sales/sales-orders.component').then((m: any) => m.SalesOrdersComponent), canActivate: [PermissionGuard], data: { permission: 'Sales.View' } },
    { path: 'reports', loadComponent: () => import('./reports/reports.component').then((m: any) => m.ReportsComponent), canActivate: [PermissionGuard], data: { permission: 'Sales.View' } },
    { path: 'roles', component: RolesComponent, canActivate: [PermissionGuard], data: { permission: 'Roles.View' } },
    { path: 'users', component: UsersComponent, canActivate: [PermissionGuard], data: { permission: 'Users.View' } },
    { path: 'customers', component: CustomersComponent, canActivate: [PermissionGuard], data: { permission: 'Customers.Manage' } },
    { path: 'jira', component: JiraComponent, canActivate: [PermissionGuard], data: { permission: 'Roles.View' } },
    { path: 'empty', component: Empty },
    { path: '**', redirectTo: '/notfound' }
] as Routes;
