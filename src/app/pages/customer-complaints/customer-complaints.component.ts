import { Component, OnInit } from '@angular/core';
import { ComplaintService, Complaint, ComplaintNote } from '../service/complaint.service';
import { AuthService } from '../../auth/auth.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { InputNumberModule } from 'primeng/inputnumber';
import { ToolbarModule } from 'primeng/toolbar';
import { TagModule } from 'primeng/tag';

@Component({
    selector: 'app-customer-complaints',
    standalone: true,
    imports: [CommonModule, FormsModule, TableModule, ButtonModule, DialogModule, InputTextModule, TextareaModule, InputNumberModule, ToolbarModule, TagModule],
    templateUrl: './customer-complaints.component.html'
})
export class CustomerComplaintsComponent implements OnInit {
    complaints: Complaint[] = [];
    dialog = false;
    orderCode = '';
    quantity?: number;
    description = '';

    viewDialog = false;
    selected?: Complaint;
    noteText = '';

    constructor(private svc: ComplaintService, private auth: AuthService) { }

    ngOnInit(): void {
        this.svc.getAll().subscribe(list => {
            const me = this.auth.getCurrentUserSync()?.userName;
            this.complaints = list.filter(c => c.customerUser === me);
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
        this.svc.create({
            customerUser: me,
            orderCode: this.orderCode,
            quantity: Number(this.quantity || 0),
            description: this.description,
            notes: []
        });
        this.dialog = false;
        this.orderCode = '';
        this.quantity = undefined;
        this.description = '';
    }

    view(c: Complaint) {
        this.selected = c;
        this.viewDialog = true;
    }

    addNoteToSelected() {
        if (!this.selected || !this.noteText?.trim()) return;
        const note: ComplaintNote = { author: this.auth.getCurrentUserSync()?.userName ?? 'customer', role: 'Customer', text: this.noteText, time: new Date().toISOString() };
        this.svc.addNote(this.selected.id, note);
        this.noteText = '';
        this.refreshSelected();
    }

    removeNote(index: number) {
        if (!this.selected) return;
        this.svc.deleteNote(this.selected.id, index);
        this.refreshSelected();
    }

    private refreshSelected() {
        const updated = this.svc.getSnapshot().find(i => i.id === this.selected?.id);
        if (updated) {
            this.selected = updated;
            const me = this.auth.getCurrentUserSync()?.userName;
            this.complaints = this.svc.getSnapshot().filter(l => l.customerUser === me);
        }
    }
}
