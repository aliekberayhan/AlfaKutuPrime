import { Component, OnInit } from '@angular/core';
import { SampleService, SampleRequest, SampleNote } from '../service/sample.service';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { ToolbarModule } from 'primeng/toolbar';
import { MessageService } from 'primeng/api';
import { AuthService } from '../../auth/auth.service';
import { TextareaModule } from 'primeng/textarea';

@Component({
  selector: 'app-muhasebe',
  standalone: true,
  imports: [CommonModule, FormsModule, TableModule, ButtonModule, DialogModule, InputTextModule, ToolbarModule],
  providers: [MessageService],
  templateUrl: './muhasebe.component.html'
})
export class MuhasebeComponent implements OnInit {
  requests: SampleRequest[] = [];
  noteDialog = false;
  selected?: SampleRequest;
  noteText = '';

  constructor(private svc: SampleService, private msg: MessageService, private auth: AuthService) {}

  ngOnInit(): void {
    this.svc.getAll().subscribe(list => {
      this.requests = list;
    });
  }

  refresh() {
    // no-op because subscription keeps updated
  }

  setInAccounting(r: SampleRequest) {
    this.svc.updateStatus(r.id, 'InAccounting');
    this.msg.add({ severity: 'info', summary: 'New InAccounting', detail: `Sample ${r.id} moved to InAccounting`, life: 4000 });
  }

  addNote(r: SampleRequest) {
    this.openNoteDialog(r);
  }

  openNoteDialog(r: SampleRequest) {
    this.selected = r;
    this.noteText = '';
    this.noteDialog = true;
  }

  confirmAddNote() {
    if (!this.selected || !this.noteText?.trim()) return;
    const note: SampleNote = { author: this.auth.getCurrentUserSync()?.userName ?? 'accounting', role: 'Muhasebe', text: this.noteText, time: new Date().toISOString() };
    this.svc.addNote(this.selected.id, note);
    this.msg.add({ severity: 'success', summary: 'Note added', detail: `Note added to ${this.selected.id}` });
    const updated = this.svc.getSnapshot().find(i => i.id === this.selected?.id);
    if (updated) this.selected = updated;
    this.noteDialog = false;
  }
}

