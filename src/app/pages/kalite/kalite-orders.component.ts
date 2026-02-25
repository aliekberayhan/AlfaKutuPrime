import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { ToolbarModule } from 'primeng/toolbar';
import { TagModule } from 'primeng/tag';
import { CustomerOrderService, CustomerOrder } from '../service/customer-order.service';

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

    constructor(private svc: CustomerOrderService) { }

    ngOnInit(): void {
        this.svc.getAll().subscribe(list => {
            // Show only approved orders
            this.orders = list.filter(o => o.status === 'Approved');
            if (this.selected) {
                const updated = list.find(i => i.id === this.selected?.id);
                if (updated) this.selected = updated;
            }
        });
    }

    view(order: CustomerOrder) {
        this.selected = order;
        this.viewDialog = true;
    }

    getSeverity(status?: string) {
        switch ((status || '').toLowerCase()) {
            case 'pending':
                return 'warn';
            case 'approved':
                return 'success';
            case 'rejected':
                return 'danger';
            default:
                return 'info';
        }
    }
}
