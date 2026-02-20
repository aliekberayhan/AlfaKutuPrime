import { Component, OnInit } from '@angular/core';
import { USERS } from '../../auth/static-auth.data';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { ToolbarModule } from 'primeng/toolbar';

@Component({
  selector: 'app-customers',
  standalone: true,
  imports: [CommonModule, TableModule, ToolbarModule],
  templateUrl: './customers.component.html'
})
export class CustomersComponent implements OnInit {
  customers = USERS.filter(u => u.roles.includes('Customer'));
  constructor() {}
  ngOnInit(): void {}
}

