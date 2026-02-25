import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { ToolbarModule } from 'primeng/toolbar';
import { FormsModule } from '@angular/forms';
import { TagModule } from 'primeng/tag';
import { MessageService } from 'primeng/api';
import { CustomerOrderService, CustomerOrder } from '../service/customer-order.service';
import { AuthService } from '../../auth/auth.service';

@Component({
  selector: 'app-sales-orders',
  standalone: true,
  imports: [CommonModule, TableModule, ButtonModule, DialogModule, FormsModule, TagModule, ToolbarModule],
  providers: [MessageService],
  templateUrl: './sales-orders.component.html',
})
export class SalesOrdersComponent implements OnInit {
  orders: CustomerOrder[] = [];
  selected?: CustomerOrder;
  viewDialog = false;

  constructor(private svc: CustomerOrderService, private auth: AuthService, private msg: MessageService) { }

  ngOnInit(): void {
    this.svc.getAll().subscribe(list => {
      this.orders = list;
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

  approve() {
    if (!this.selected) return;
    const me = this.auth.getCurrentUserSync()?.userName ?? 'sales';
    this.svc.approve(this.selected.id, me);
    this.msg.add({ severity: 'success', summary: 'Approved', detail: 'Order has been approved successfully.' });
    this.viewDialog = false;
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
      default:
        return 'info';
    }
  }

  canApprove(order: CustomerOrder): boolean {
    return order.status === 'Pending';
  }
}


