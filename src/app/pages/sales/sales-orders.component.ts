import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { ToolbarModule } from 'primeng/toolbar';
import { FormsModule } from '@angular/forms';
import { TagModule } from 'primeng/tag';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MessageService, ConfirmationService } from 'primeng/api';
import { CustomerOrderService, CustomerOrder } from '../service/customer-order.service';
import { AuthService } from '../../auth/auth.service';

@Component({
  selector: 'app-sales-orders',
  standalone: true,
  imports: [CommonModule, TableModule, ButtonModule, DialogModule, FormsModule, TagModule, ToolbarModule, ConfirmDialogModule],
  providers: [MessageService, ConfirmationService],
  templateUrl: './sales-orders.component.html',
})
export class SalesOrdersComponent implements OnInit {
  orders: CustomerOrder[] = [];
  selected?: CustomerOrder;
  viewDialog = false;
  statusFilter: 'All' | 'Open' | 'Approved' | 'Shipped' = 'All';

  constructor(private svc: CustomerOrderService, private auth: AuthService, private msg: MessageService,
              private confirmation: ConfirmationService) { }

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

  approve() {
    if (!this.selected) return;
    const me = this.auth.getCurrentUserSync()?.userName ?? 'sales';
    this.svc.approve(this.selected.id, me);
    this.msg.add({ severity: 'success', summary: 'Approved', detail: 'Order has been approved successfully.' });
    this.viewDialog = false;
  }

  canDelete(): boolean {
    return this.auth.hasPermission('Orders.Delete');
  }

  confirmDelete(order: CustomerOrder) {
    this.confirmation.confirm({
      message: `Delete order ${order.id}?`,
      accept: () => {
        this.svc.delete(order.id);
        this.msg.add({ severity: 'success', summary: 'Deleted', detail: 'Order has been removed.' });
        if (this.selected && this.selected.id === order.id) {
          this.viewDialog = false;
          this.selected = undefined;
        }
      }
    });
  }

  reject() {
    if (!this.selected) return;
    this.svc.reject(this.selected.id);
    this.msg.add({ severity: 'info', summary: 'Rejected', detail: 'Order has been rejected.' });
    this.viewDialog = false;
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

  canApprove(order: CustomerOrder): boolean {
    return order.status === 'Pending';
  }
}


