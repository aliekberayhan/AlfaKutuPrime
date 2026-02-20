import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { AppMenuitem } from './app.menuitem';
import { AuthService } from '../../auth/auth.service';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-menu',
    standalone: true,
    imports: [CommonModule, AppMenuitem, RouterModule],
    template: `<ul class="layout-menu">
        @for (item of model; track item.label) {
            @if (!item.separator) {
                <li app-menuitem [item]="item" [root]="true"></li>
            } @else {
                <li class="menu-separator"></li>
            }
        }
    </ul> `,
})
export class AppMenu implements OnInit, OnDestroy {
    model: MenuItem[] = [];
    private fullModel: MenuItem[] = [];
    private sub?: Subscription;

    constructor(private auth: AuthService) {}

    ngOnInit() {
        this.fullModel = [
            {
                label: 'Home',
                items: [{ label: 'Dashboard', icon: 'pi pi-fw pi-home', routerLink: ['/'] }]
            },
            {
                label: 'Pages',
                icon: 'pi pi-fw pi-briefcase',
                path: '/pages',
                items: [
                    {
                        label: 'Landing',
                        icon: 'pi pi-fw pi-globe',
                        routerLink: ['/landing']
                    },
                    {
                        label: 'Auth',
                        icon: 'pi pi-fw pi-user',
                        path: '/auth',
                        items: [
                            {
                                label: 'Login',
                                icon: 'pi pi-fw pi-sign-in',
                                routerLink: ['/auth/login']
                            }
                        ]
                    },
                    {
                        label: 'Fisler',
                        icon: 'pi pi-fw pi-pencil',
                        routerLink: ['/pages/fisler'],
                        permission: 'Fis.View'
                    }
                    ,
                    {
                        label: 'Customer Samples',
                        icon: 'pi pi-fw pi-file',
                        routerLink: ['/pages/customer-samples'],
                        permission: 'Samples.Create'
                    },
                    {
                        label: 'Muhasebe',
                        icon: 'pi pi-fw pi-money-bill',
                        routerLink: ['/pages/muhasebe'],
                        permission: 'Samples.Manage'
                    },
                    {
                        label: 'Numune Talebi',
                        icon: 'pi pi-fw pi-check-circle',
                        routerLink: ['/pages/kalite-samples'],
                        permission: 'Kalite.View'
                    },
                    {
                        label: 'Customers',
                        icon: 'pi pi-fw pi-check-circle',
                        routerLink: ['/pages/customers'],
                        permission: 'Customer.View'
                    }
                ]
            },
            {
                label: 'Admin',
                icon: 'pi pi-fw pi-cog',
                permission: 'Admin',
                items: [
                    { label: 'Users', icon: 'pi pi-fw pi-users', routerLink: ['/pages/users'], permission: 'Users.View' },
                    { label: 'Roles', icon: 'pi pi-fw pi-lock', routerLink: ['/pages/roles'], permission: 'Roles.View' }
                ]
            }
        ];

        this.model = this.filterModel(this.fullModel);

        // update menu when auth state changes
        this.sub = this.auth.getCurrentUser().subscribe(() => {
            this.model = this.filterModel(this.fullModel);
        });
        // also refresh when role definitions change
        this.auth.getRolesChanged().subscribe(() => {
            this.model = this.filterModel(this.fullModel);
        });
    }

    private filterModel(items: any[]): MenuItem[] {
        const out: MenuItem[] = [];
        for (const it of items) {
            if ((it as any).permission) {
                if (!this.auth.hasPermission((it as any).permission)) continue;
            }
            const copy = { ...it } as any;
            if (copy.items && Array.isArray(copy.items)) {
                copy.items = this.filterModel(copy.items);
            }
            out.push(copy);
        }
        return out;
    }

    ngOnDestroy(): void {
        this.sub?.unsubscribe();
    }
}
