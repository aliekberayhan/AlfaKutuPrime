import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { InputNumberModule } from 'primeng/inputnumber';
import { ToolbarModule } from 'primeng/toolbar';
import { TagModule } from 'primeng/tag';
import { SelectModule } from 'primeng/select';
import { FileUploadModule } from 'primeng/fileupload';
import { CustomerOrderService, CustomerOrder, CustomerOrderItem, Product, PRODUCTS } from '../service/customer-order.service';
import { AuthService } from '../../auth/auth.service';

@Component({
    selector: 'app-customer-orders',
    standalone: true,
    imports: [CommonModule, FormsModule, TableModule, ButtonModule, DialogModule, InputTextModule, TextareaModule, InputNumberModule, ToolbarModule, TagModule, SelectModule, FileUploadModule],
    templateUrl: './customer-orders.component.html'
})
export class CustomerOrdersComponent implements OnInit {
    orders: CustomerOrder[] = [];
    dialog = false;
    items: CustomerOrderItem[] = [];
    notes = '';
    selected?: CustomerOrder;
    viewDialog = false;
    products = PRODUCTS;
    currentItem?: CustomerOrderItem;
    statusFilter: 'All' | 'Open' | 'Approved' | 'Shipped' = 'All';

    constructor(private svc: CustomerOrderService, private auth: AuthService) { }

    ngOnInit(): void {
        this.svc.getAll().subscribe(list => {
            const me = this.auth.getCurrentUserSync()?.userName;
            this.orders = this.filterOrders(list.filter(l => l.customerUser === me));
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
        const me = this.auth.getCurrentUserSync()?.userName;
        const allOrders = this.svc.getSnapshot().filter(l => l.customerUser === me);
        this.orders = this.filterOrders(allOrders);
    }

    openNew() {
        this.items = [{ product: this.products[0], size: '', quantity: 1, documents: [] }];
        this.notes = '';
        this.dialog = true;
    }

    addItemRow() {
        this.items.push({ product: this.products[0], size: '', quantity: 1, documents: [] });
    }

    removeItem(index: number) {
        this.items.splice(index, 1);
    }

    getSizes(item: CustomerOrderItem): string[] {
        return item.product?.sizes || [];
    }

    isValidOrder(): boolean {
        if (this.items.length === 0) return false;
        return this.items.every(item =>
            item.product &&
            item.size &&
            item.size.trim() !== '' &&
            item.quantity &&
            item.quantity > 0
        );
    }

    create() {
        if (!this.isValidOrder()) return;
        const me = this.auth.getCurrentUserSync()?.userName ?? 'customer';
        this.svc.create({
            customerUser: me,
            items: this.items,
            notes: this.notes
        });
        this.dialog = false;
        this.items = [];
        this.notes = '';
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
            case 'shipped':
                return 'info';
            default:
                return 'info';
        }
    }
}

