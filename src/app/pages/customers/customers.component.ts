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
import { MultiSelectModule } from 'primeng/multiselect';

@Component({
  selector: 'app-customers',
  standalone: true,
  imports: [CommonModule, FormsModule, TableModule, ToolbarModule, ButtonModule, DialogModule, InputTextModule, ConfirmDialogModule, MultiSelectModule, CheckboxModule],
  providers: [ConfirmationService, MessageService],
  templateUrl: './customers.component.html'
})
export class CustomersComponent implements OnInit {
  customers = USERS.filter(u => u.roles.includes('Customer'));
  selectedCustomers: any[] | null = null;
  customerDialog = false;
  current: any = { userName: '', password: '', roles: ['Customer'], active: true };

  constructor(private auth: AuthService, private confirmation: ConfirmationService, private messageService: MessageService) {}

  ngOnInit(): void {
    this.auth.getUsers().subscribe(list => this.customers = list.filter(u => u.roles.includes('Customer')));
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
    const obj: any = { userName: this.current.userName, password: this.current.password, roles: ['Customer'], active: !!this.current.active };
    const existing = this.auth.getUsersSnapshot().find(u => u.userName === obj.userName);
    if (existing) {
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

