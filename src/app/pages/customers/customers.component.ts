import { Component, OnInit } from '@angular/core';
import { USERS } from '../../auth/static-auth.data';
import { AuthService } from '../../auth/auth.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ToolbarModule } from 'primeng/toolbar';
import { CheckboxModule } from 'primeng/checkbox';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { OrdersService } from '../service/orders.service';
import { MultiSelectModule } from 'primeng/multiselect';
import { TextareaModule } from 'primeng/textarea';

@Component({
  selector: 'app-customers',
  standalone: true,
  imports: [CommonModule, FormsModule, TableModule, ToolbarModule, ButtonModule, DialogModule, InputTextModule, ConfirmDialogModule, MultiSelectModule, CheckboxModule, TextareaModule],
  providers: [ConfirmationService, MessageService],
  templateUrl: './customers.component.html'
})
export class CustomersComponent implements OnInit {
  customers: any[] = [];
  selectedCustomers: any[] | null = null;
  customerDialog = false;
  current: any = { userName: '', password: '', roles: ['Customer'], active: true, displayName: '', company: '', contactName: '', contactTitle: '', address: '', representative: '' };
  salesUsers: any[] = [];

  constructor(private auth: AuthService, private confirmation: ConfirmationService, private messageService: MessageService, private ordersSvc: OrdersService) {}

  ngOnInit(): void {
    // ensure any customers present in orders are created as user entries
    const orders = this.ordersSvc.getAll();
    const names = Array.from(new Set(orders.map(o => o.customer)));
    const existing = this.auth.getUsersSnapshot();
    for (const n of names) {
      if (!existing.find(u => u.userName === n)) {
        // add minimal customer record
        this.auth.addUser({ userName: n, password: 'changeme', roles: ['Customer'], active: true, displayName: n, company: '', contactName: '', contactTitle: '', address: '', representative: '' } as any);
      }
    }

    // Merge richer sample data from static USERS into existing stored users (if any)
    for (const s of USERS) {
      const ex = existing.find(u => u.userName === s.userName);
      if (ex) {
        const merged = { ...ex, ...s };
        if (!s.password && ex.password) merged.password = ex.password;
        this.auth.updateUser(merged);
      }
    }

    // subscribe to users and also build salesUsers dropdown options
    this.auth.getUsers().subscribe(list => {
      this.customers = list.filter(u => u.roles.includes('Customer'));
      this.salesUsers = list.filter(u => u.roles.includes('Sales')).map(u => ({ label: u.displayName || u.userName, value: u.userName }));
    });
  }

  openNew() {
    this.current = { userName: '', password: '', roles: ['Customer'], active: true };
    this.customerDialog = true;
  }

  editCustomer(c: any) {
    this.current = { ...c };
    this.customerDialog = true;
  }

  hideDialog() {
    this.customerDialog = false;
  }

  saveCustomer() {
    if (!this.current.userName) return;
    const existing = this.auth.getUsersSnapshot().find(u => u.userName === this.current.userName);
    const obj: any = {
      userName: this.current.userName,
      roles: ['Customer'],
      active: !!this.current.active,
      displayName: this.current.displayName || this.current.userName,
      company: this.current.company || '',
      contactName: this.current.contactName || '',
      contactTitle: this.current.contactTitle || '',
      address: this.current.address || '',
      representative: this.current.representative || ''
    };
    // if password provided (new or change), include it
    if (this.current.password) obj.password = this.current.password;
    if (existing) {
      // preserve existing password if not changed
      if (!obj.password && existing.password) obj.password = existing.password;
      this.auth.updateUser(obj);
      this.messageService.add({ severity: 'success', summary: 'Updated', detail: 'Customer updated' });
      const logged = this.auth.getCurrentUserSync();
      if (logged && logged.userName === obj.userName && !obj.active) this.auth.logout();
    } else {
      this.auth.addUser(obj);
      this.messageService.add({ severity: 'success', summary: 'Added', detail: 'Customer added' });
    }
    this.customerDialog = false;
  }

  confirmDelete(c: any) {
    this.confirmation.confirm({
      message: `Delete ${c.userName}?`,
      accept: () => {
        this.auth.deleteUser(c.userName);
        this.messageService.add({ severity: 'success', summary: 'Deleted', detail: 'Customer deleted' });
      }
    });
  }

  deleteSelectedCustomers() {
    if (!this.selectedCustomers || !this.selectedCustomers.length) return;
    const names = this.selectedCustomers.map(u => u.userName);
    this.confirmation.confirm({
      message: 'Delete selected customers?',
      accept: () => {
        for (const n of names) this.auth.deleteUser(n);
        this.selectedCustomers = null;
        this.messageService.add({ severity: 'success', summary: 'Deleted', detail: 'Customers deleted' });
      }
    });
  }
}

