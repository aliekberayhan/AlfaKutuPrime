import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type SampleStatus = 'Created' | 'InAccounting' | 'Ready';

export interface SampleNote {
  author: string;
  role?: string;
  text: string;
  time: string;
}

export interface SampleRequest {
  id: string;
  title?: string;
  customerUser: string;
  createdAt: string;
  status: SampleStatus;
  notes: SampleNote[];
  productCode?: string;
  quantity?: number;
}

const STORAGE_KEY = 'sample_requests_v1';

@Injectable({ providedIn: 'root' })
export class SampleService {
  private items$ = new BehaviorSubject<SampleRequest[]>(this.load());

  getAll() {
    return this.items$.asObservable();
  }

  // synchronous snapshot (helpers for UI updates)
  getSnapshot(): SampleRequest[] {
    return this.items$.getValue();
  }

  create(request: Omit<SampleRequest, 'id' | 'createdAt'>) {
    const id = 'SR-' + Math.random().toString(36).slice(2,9).toUpperCase();
    const createdAt = new Date().toISOString();
    const item: SampleRequest = { ...request, id, createdAt };
    const list = [item, ...this.items$.getValue()];
    this.save(list);
    this.items$.next(list);
    return item;
  }

  updateStatus(id: string, status: SampleStatus) {
    const list = this.items$.getValue().map(it => it.id === id ? { ...it, status } : it);
    this.save(list);
    this.items$.next(list);
  }

  addNote(id: string, note: SampleNote) {
    const list = this.items$.getValue().map(it => {
      if (it.id !== id) return it;
      return { ...it, notes: [...it.notes, note] };
    });
    this.save(list);
    this.items$.next(list);
  }

  private load(): SampleRequest[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      return JSON.parse(raw) as SampleRequest[];
    } catch {
      return [];
    }
  }

  private save(list: SampleRequest[]) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  }
}

