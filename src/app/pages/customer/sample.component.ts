import { Component, OnInit } from '@angular/core';
import { SampleService, SampleRequest } from '../service/sample.service';
import { AuthService } from '../../auth/auth.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { ToolbarModule } from 'primeng/toolbar';
import { SampleNote } from '../service/sample.service';

@Component({
  selector: 'app-customer-samples',
  standalone: true,
  imports: [CommonModule, FormsModule, TableModule, ButtonModule, DialogModule, InputTextModule, ToolbarModule],
  templateUrl: './sample.component.html'
})
export class CustomerSampleComponent implements OnInit {
  requests: SampleRequest[] = [];
  dialog = false;
  title = '';

  constructor(private svc: SampleService, private auth: AuthService) {}

  ngOnInit(): void {
    this.svc.getAll().subscribe(list => {
      const me = this.auth.getCurrentUserSync()?.userName;
      this.requests = list.filter(l => l.customerUser === me);
    });
  }

  openNew() {
    this.dialog = true;
  }

  create() {
    const me = this.auth.getCurrentUserSync()?.userName ?? 'unknown';
    const req = this.svc.create({ customerUser: me, status: 'Created', notes: [], title: this.title });
    this.dialog = false;
    this.title = '';
  }

  view(r: SampleRequest) {
    alert(`Notes: ${r.notes.map(n => n.text).join('\\n')}`);
  }
}

