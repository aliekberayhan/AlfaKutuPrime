import { Component, OnInit } from '@angular/core';
import { ROLES, PERMISSIONS } from '../../auth/static-auth.data';
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
  selector: 'app-roles-page',
  standalone: true,
  imports: [CommonModule, FormsModule, TableModule, ButtonModule, ToolbarModule, DialogModule, InputTextModule, MultiSelectModule, ConfirmDialogModule],
  providers: [ConfirmationService, MessageService],
  templateUrl: './roles.component.html'
})
export class RolesPageComponent implements OnInit {
  roles = ROLES;
  permOptions = PERMISSIONS.map(p => ({ label: p, value: p }));
  selectedRoles: any[] | null = null;
  roleDialog = false;
  current: any = { name: '', displayName: '', permissions: [] as string[] };

  constructor(private confirmation: ConfirmationService, private messageService: MessageService, private auth: AuthService) {}
  ngOnInit(): void {}

  onGlobalFilter(table: Table, event: Event): void {
    const value = (event.target as HTMLInputElement).value ?? '';
    table.filterGlobal(value, 'contains');
  }

  exportCSV(table?: Table): void {
    table?.exportCSV();
  }

  openNew() {
    this.current = { name: '', displayName: '', permissions: [] };
    this.roleDialog = true;
  }

  editRole(role: any) {
    this.current = { ...role };
    this.roleDialog = true;
  }

  hideDialog() {
    this.roleDialog = false;
  }

  saveRole() {
    if (!this.current.name) return;
    const idx = this.roles.findIndex((r:any) => r.name === this.current.name);
    if (idx >= 0) {
      this.roles[idx] = { ...this.current };
      this.messageService.add({ severity: 'success', summary: 'Updated', detail: 'Role updated' });
    } else {
      this.roles.push({ name: this.current.name, displayName: this.current.displayName, permissions: this.current.permissions });
      this.messageService.add({ severity: 'success', summary: 'Added', detail: 'Role added' });
    }
    this.roleDialog = false;
    this.auth.notifyRolesChanged();
  }

  confirmDelete(role: any) {
    this.confirmation.confirm({
      message: `Delete ${role.name}?`,
      accept: () => {
        this.roles = this.roles.filter((r:any) => r.name !== role.name);
        this.messageService.add({ severity: 'success', summary: 'Deleted', detail: 'Role deleted' });
        this.auth.notifyRolesChanged();
      }
    });
  }

  deleteSelectedRoles() {
    if (!this.selectedRoles || !this.selectedRoles.length) return;
    const selectedNames = this.selectedRoles.map((r:any) => r.name);
    const set = new Set(selectedNames);
    this.confirmation.confirm({
      message: 'Delete selected roles?',
      accept: () => {
        this.roles = this.roles.filter((r:any) => !set.has(r.name));
        this.selectedRoles = null;
        this.messageService.add({ severity: 'success', summary: 'Deleted', detail: 'Roles deleted' });
        this.auth.notifyRolesChanged();
      }
    });
  }
}

