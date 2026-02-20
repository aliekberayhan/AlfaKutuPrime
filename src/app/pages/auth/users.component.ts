import { Component, OnInit } from '@angular/core';
import { USERS, ROLES } from '../../auth/static-auth.data';
import { AuthService } from '../../auth/auth.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { ToolbarModule } from 'primeng/toolbar';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { MultiSelectModule } from 'primeng/multiselect';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { Table } from 'primeng/table';

@Component({
  selector: 'app-users-page',
  standalone: true,
  imports: [CommonModule, FormsModule, TableModule, ButtonModule, ToolbarModule, DialogModule, InputTextModule, MultiSelectModule, ConfirmDialogModule],
  providers: [ConfirmationService, MessageService],
  templateUrl: './users.component.html'
})
export class UsersPageComponent implements OnInit {
  users = USERS;
  selectedUsers: any[] | null = null;
  userDialog = false;
  current: any = { userName: '', password: '', roles: [] as string[] };
  roleOptions = ROLES.map(r => ({ label: r.displayName ?? r.name, value: r.name }));

  constructor(private auth: AuthService, private confirmation: ConfirmationService, private messageService: MessageService) {}

  ngOnInit(): void {}

  onGlobalFilter(table: Table, event: Event): void {
    const value = (event.target as HTMLInputElement).value ?? '';
    table.filterGlobal(value, 'contains');
  }

  exportCSV(table?: Table): void {
    table?.exportCSV();
  }

  openNew() {
    this.current = { userName: '', password: '', roles: [] };
    this.userDialog = true;
  }

  editUser(user: any) {
    this.current = { ...user };
    this.userDialog = true;
  }

  hideDialog() {
    this.userDialog = false;
  }

  saveUser() {
    if (!this.current.userName) return;
    const idx = this.users.findIndex(u => u.userName === this.current.userName);
    if (idx >= 0) {
      this.users[idx] = { ...this.current };
      this.messageService.add({ severity: 'success', summary: 'Updated', detail: 'User updated' });
    } else {
      this.users.push({ userName: this.current.userName, password: this.current.password, roles: this.current.roles });
      this.messageService.add({ severity: 'success', summary: 'Added', detail: 'User added' });
    }
    const logged = this.auth.getCurrentUserSync();
    if (logged && logged.userName === this.current.userName) {
      this.auth.setCurrentUser({ userName: this.current.userName, roles: [...this.current.roles] });
    }
    this.userDialog = false;
  }

  confirmDelete(user: any) {
    this.confirmation.confirm({
      message: `Delete ${user.userName}?`,
      accept: () => {
        this.users = this.users.filter(u => u.userName !== user.userName);
        this.messageService.add({ severity: 'success', summary: 'Deleted', detail: 'User deleted' });
        const logged = this.auth.getCurrentUserSync();
        if (logged && logged.userName === user.userName) {
          this.auth.logout();
        }
      }
    });
  }

  deleteSelectedUsers() {
    if (!this.selectedUsers || !this.selectedUsers.length) return;
    const selectedNames = this.selectedUsers.map((u: any) => u.userName);
    const set = new Set(selectedNames);
    this.confirmation.confirm({
      message: 'Delete selected users?',
      accept: () => {
        this.users = this.users.filter(u => !set.has(u.userName));
        const logged = this.auth.getCurrentUserSync();
        if (logged && set.has(logged.userName)) {
          this.auth.logout();
        }
        this.selectedUsers = null;
        this.messageService.add({ severity: 'success', summary: 'Deleted', detail: 'Users deleted' });
      }
    });
  }
}

