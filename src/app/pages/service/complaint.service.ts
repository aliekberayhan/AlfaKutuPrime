import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface ComplaintNote {
    author: string;
    role?: string;
    text: string;
    time: string;
}

export interface AnalysisEntry {
    cause: string;
    actions: string[];
}

export interface Complaint {
    id: string;
    customerUser: string;
    createdAt: string;
    orderCode: string;
    quantity?: number;
    description?: string;
    analysis?: AnalysisEntry[];
    status?: 'Open' | 'Resolved';
    resolvedAt?: string;
    notes: ComplaintNote[];
}

const STORAGE_KEY = 'customer_complaints_v1';

@Injectable({ providedIn: 'root' })
export class ComplaintService {
    private items$ = new BehaviorSubject<Complaint[]>(this.load());

    getAll() {
        return this.items$.asObservable();
    }

    // synchronous snapshot helper
    getSnapshot(): Complaint[] {
        return this.items$.getValue();
    }

    create(data: Omit<Complaint, 'id' | 'createdAt' | 'status' | 'resolvedAt'>) {
        const id = 'CPL-' + Math.random().toString(36).slice(2, 9).toUpperCase();
        const createdAt = new Date().toISOString();
        const item: Complaint = { ...data, id, createdAt, status: 'Open', analysis: [] } as Complaint;
        const list = [item, ...this.items$.getValue()];
        this.save(list);
        this.items$.next(list);
        return item;
    }

    addNote(id: string, note: ComplaintNote) {
        const list = this.items$.getValue().map(it => {
            if (it.id !== id) return it;
            return { ...it, notes: [...it.notes, note] };
        });
        this.save(list);
        this.items$.next(list);
    }

    deleteNote(id: string, index: number) {
        const list = this.items$.getValue().map(it => {
            if (it.id !== id) return it;
            const notes = [...it.notes];
            notes.splice(index, 1);
            return { ...it, notes };
        });
        this.save(list);
        this.items$.next(list);
    }

    updateAnalysis(id: string, analysis: AnalysisEntry[]) {
        const list = this.items$.getValue().map(it => {
            if (it.id !== id) return it;
            return { ...it, analysis };
        }) as Complaint[];
        this.save(list);
        this.items$.next(list);
    }

    markResolved(id: string) {
        const resolvedAt = new Date().toISOString();
        const list = this.items$.getValue().map(it => {
            if (it.id !== id) return it;
            return { ...it, status: 'Resolved' as 'Resolved', resolvedAt } as Complaint;
        }) as Complaint[];
        this.save(list);
        this.items$.next(list);
    }

    private load(): Complaint[] {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return [];
            return JSON.parse(raw) as Complaint[];
        } catch {
            return [];
        }
    }

    private save(list: Complaint[]) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    }
}
