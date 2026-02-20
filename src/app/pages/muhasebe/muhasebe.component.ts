import { Component, OnInit } from '@angular/core';
import { SampleService, SampleRequest, SampleNote } from '../service/sample.service';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { ToolbarModule } from 'primeng/toolbar';
import { MessageService } from 'primeng/api';
import { AuthService } from '../../auth/auth.service';

@Component({
  selector: 'app-muhasebe',
  standalone: true,
  imports: [CommonModule, TableModule, ButtonModule, DialogModule, InputTextModule, ToolbarModule],
  providers: [MessageService],
  templateUrl: './muhasebe.component.html'
})
export class MuhasebeComponent implements OnInit {
  requests: SampleRequest[] = [];

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
    const text = prompt('Note');
    if (!text) return;
    const note: SampleNote = { author: this.auth.getCurrentUserSync()?.userName ?? 'accounting', role: 'Muhasebe', text, time: new Date().toISOString() };
    this.svc.addNote(r.id, note);
    this.msg.add({ severity: 'success', summary: 'Note added', detail: `Note added to ${r.id}` });
  }
}

