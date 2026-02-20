import { Component, OnInit } from '@angular/core';
import { SampleService, SampleRequest, SampleNote } from '../service/sample.service';
import { AuthService } from '../../auth/auth.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { ToolbarModule } from 'primeng/toolbar';

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
  productCode = '';
  quantity?: number;
  viewDialog = false;
  selected?: SampleRequest;
  noteText = '';

  constructor(private svc: SampleService, private auth: AuthService) {}

  ngOnInit(): void {
    this.svc.getAll().subscribe(list => {
      const me = this.auth.getCurrentUserSync()?.userName;
      this.requests = list.filter(l => l.customerUser === me);
      // if a request is currently viewed, refresh its data from the updated list
      if (this.selected) {
        const updated = list.find(i => i.id === this.selected?.id);
        if (updated) {
          this.selected = updated;
        }
      }
    });
  }

  openNew() {
    this.dialog = true;
  }

  create() {
    const me = this.auth.getCurrentUserSync()?.userName ?? 'unknown';
    const req = this.svc.create({ customerUser: me, status: 'Created', notes: [], title: this.title, productCode: this.productCode, quantity: Number(this.quantity || 0) });
    this.dialog = false;
    this.title = '';
    this.productCode = '';
    this.quantity = undefined;
  }

  view(r: SampleRequest) {
    this.selected = r;
    this.viewDialog = true;
  }
  addNoteToSelected() {
    if (!this.selected || !this.noteText?.trim()) return;
    const note: SampleNote = { author: this.auth.getCurrentUserSync()?.userName ?? 'customer', text: this.noteText, time: new Date().toISOString() };
    this.svc.addNote(this.selected.id, note);
    this.noteText = '';
    // refresh selected reference so modal shows updated notes immediately
    const updated = this.svc.getSnapshot().find(i => i.id === this.selected?.id);
    if (updated) {
      this.selected = updated;
      // also refresh list shown to user
      const me = this.auth.getCurrentUserSync()?.userName;
      this.requests = this.svc.getSnapshot().filter(l => l.customerUser === me);
    }
  }
}

