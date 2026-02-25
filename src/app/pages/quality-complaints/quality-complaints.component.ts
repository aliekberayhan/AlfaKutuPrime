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
import { ToolbarModule } from 'primeng/toolbar';
import { TagModule } from 'primeng/tag';
import { MessageService } from 'primeng/api';

@Component({
    selector: 'app-quality-complaints',
    standalone: true,
    imports: [CommonModule, FormsModule, TableModule, ButtonModule, DialogModule, InputTextModule, TextareaModule, ToolbarModule, TagModule],
    providers: [MessageService],
    templateUrl: './quality-complaints.component.html'
})
export class QualityComplaintsComponent implements OnInit {
    complaints: Complaint[] = [];
    analysisDialog = false;
    selected?: Complaint;
    analysisEntries: { cause: string; actions: string[] }[] = [];
    noteText = '';

    constructor(private svc: ComplaintService, private auth: AuthService, private msg: MessageService) { }

    trackByIndex(index: number, item: any) {
        return index;
    }

    ngOnInit(): void {
        this.svc.getAll().subscribe(list => {
            this.complaints = list;
            if (this.selected) {
                const updated = list.find(i => i.id === this.selected?.id);
                if (updated) this.selected = updated;
            }
        });
    }

    openAnalysis(c: Complaint) {
        this.selected = c;
        // copy existing analysis entries or start empty
        this.analysisEntries = c.analysis ? c.analysis.map(a => ({ cause: a.cause, actions: [...a.actions] })) : [];
        this.analysisDialog = true;
    }

    markResolved(c: Complaint) {
        if (c.status === 'Resolved') return;
        this.svc.markResolved(c.id);
        this.msg.add({ severity: 'success', summary: 'Resolved', detail: `Complaint ${c.id} marked resolved` });
        // refresh list
        this.complaints = this.svc.getSnapshot();
        if (this.selected && this.selected.id === c.id) {
            this.selected = this.svc.getSnapshot().find(i => i.id === c.id);
        }
    }

    saveAnalysis() {
        if (!this.selected) return;
        this.svc.updateAnalysis(this.selected.id, this.analysisEntries);
        this.msg.add({ severity: 'success', summary: 'Saved', detail: 'Analysis updated' });
        this.analysisDialog = false;
    }

    // analysis entry helpers
    addCause() {
        this.analysisEntries.push({ cause: '', actions: [] });
    }

    removeCause(index: number) {
        this.analysisEntries.splice(index, 1);
    }

    addAction(causeIndex: number) {
        this.analysisEntries[causeIndex].actions.push('');
    }

    removeAction(causeIndex: number, actionIndex: number) {
        this.analysisEntries[causeIndex].actions.splice(actionIndex, 1);
    }

    addNoteToSelected() {
        if (!this.selected || !this.noteText?.trim()) return;
        const note: ComplaintNote = { author: this.auth.getCurrentUserSync()?.userName ?? 'quality', role: 'Kalite', text: this.noteText, time: new Date().toISOString() };
        this.svc.addNote(this.selected.id, note);
        this.noteText = '';
        this.refreshSelected();
    }

    removeNote(index: number) {
        if (!this.selected) return;
        this.svc.deleteNote(this.selected.id, index);
        this.refreshSelected();
    }

    countActions(complaint: Complaint): number {
        return complaint.analysis?.reduce((sum, entry) => sum + entry.actions.length, 0) || 0;
    }

    private refreshSelected() {
        const updated = this.svc.getSnapshot().find(i => i.id === this.selected?.id);
        if (updated) this.selected = updated;
    }
}
