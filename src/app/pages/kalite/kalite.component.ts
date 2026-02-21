import { Component, OnInit } from '@angular/core';
import { SampleService, SampleRequest, SampleNote } from '../service/sample.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { ToolbarModule } from 'primeng/toolbar';
import { MessageService } from 'primeng/api';
import { AuthService } from '../../auth/auth.service';
import { TagModule } from 'primeng/tag';

@Component({
  selector: 'app-kalite',
  standalone: true,
  imports: [CommonModule, FormsModule, TableModule, ButtonModule, DialogModule, InputTextModule, ToolbarModule, TagModule],
  providers: [MessageService],
  templateUrl: './kalite.component.html'
})
export class KaliteComponent implements OnInit {
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

  markReady(r: SampleRequest) {
    this.svc.updateStatus(r.id, 'Ready');
    this.msg.add({ severity: 'success', summary: 'Ready', detail: `Sample ${r.id} marked Ready` });
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
    const note: SampleNote = { author: this.auth.getCurrentUserSync()?.userName ?? 'kalite', role: 'Kalite', text: this.noteText, time: new Date().toISOString() };
    this.svc.addNote(this.selected.id, note);
    this.msg.add({ severity: 'success', summary: 'Note added', detail: `Note added to ${this.selected.id}` });
    const updated = this.svc.getSnapshot().find(i => i.id === this.selected?.id);
    if (updated) this.selected = updated;
    this.noteDialog = false;
  }
  getSeverity(status?: string) {
    switch ((status || '').toLowerCase()) {
      case 'created':
        return 'info';
      case 'inaccounting':
        return 'warn';
      case 'ready':
        return 'success';
      default:
        return 'info';
    }
  }
}

