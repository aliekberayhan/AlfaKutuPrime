import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { ToolbarModule } from 'primeng/toolbar';
import { TagModule } from 'primeng/tag';
import { CustomerOrderService, CustomerOrder } from '../service/customer-order.service';
import { AuthService } from '../../auth/auth.service';

@Component({
    selector: 'app-kalite-orders',
    standalone: true,
    imports: [CommonModule, TableModule, ButtonModule, DialogModule, ToolbarModule, TagModule],
    templateUrl: './kalite-orders.component.html'
})
export class KaliteOrdersComponent implements OnInit {
    orders: CustomerOrder[] = [];
    selected?: CustomerOrder;
    viewDialog = false;
    statusFilter: 'All' | 'Open' | 'Approved' | 'Shipped' = 'All';

    constructor(private svc: CustomerOrderService, private auth: AuthService) { }

    ngOnInit(): void {
        this.svc.getAll().subscribe(list => {
            this.orders = this.filterOrders(list);
            if (this.selected) {
                const updated = list.find(i => i.id === this.selected?.id);
                if (updated) this.selected = updated;
            }
        });
    }

    filterOrders(list: CustomerOrder[]): CustomerOrder[] {
        switch (this.statusFilter) {
            case 'Open':
                return list.filter(o => o.status === 'Pending');
            case 'Approved':
                return list.filter(o => o.status === 'Approved');
            case 'Shipped':
                return list.filter(o => o.status === 'Shipped');
            default:
                return list;
        }
    }

    setStatusFilter(filter: 'All' | 'Open' | 'Approved' | 'Shipped') {
        this.statusFilter = filter;
        const allOrders = this.svc.getSnapshot();
        this.orders = this.filterOrders(allOrders);
    }

    view(order: CustomerOrder) {
        this.selected = order;
        this.viewDialog = true;
    }

    ship() {
        if (this.selected) {
            const me = this.auth.getCurrentUserSync()?.userName ?? 'quality';
            this.svc.ship(this.selected.id, me);
        }
    }

    getSeverity(status?: string) {
        switch ((status || '').toLowerCase()) {
            case 'pending':
                return 'warn';
            case 'approved':
                return 'success';
            case 'rejected':
                return 'danger';
            case 'shipped':
                return 'info';
            default:
                return 'info';
        }
    }
}
