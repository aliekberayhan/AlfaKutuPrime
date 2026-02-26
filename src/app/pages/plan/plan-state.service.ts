import { Injectable } from '@angular/core';

/** Plan sayfası state snapshot — sekme/sayfa değişince veri kaybolmasın diye serviste tutulur */
export interface PlanStateSnapshot {
  data: unknown[];
  cols: { field: string; header: string }[];
  sheetNames: string[];
  selectedSheet: string;
  kbRows: { Product: string; Color: string; Size: string; Material: string; Machine: string }[];
  combinedDataMachines: string[];
  combinedDataFileName: string;
  machineSettings: { name: string; faulty: boolean }[];
  machineColumnField: string | null;
  ratingColumnField: string | null;
  reihenfolgeColumnField: string | null;
  embeddedCombinedLoaded: boolean;
  embeddedCombinedError: string;
  summary: { label: string; value: string | number }[];
}

@Injectable({ providedIn: 'root' })
export class PlanStateService {
  private snapshot: PlanStateSnapshot | null = null;

  hasState(): boolean {
    return this.snapshot != null && Array.isArray(this.snapshot.data) && this.snapshot.data.length > 0;
  }

  setState(snapshot: PlanStateSnapshot): void {
    this.snapshot = snapshot;
  }

  getState(): PlanStateSnapshot | null {
    return this.snapshot;
  }

  clear(): void {
    this.snapshot = null;
  }
}
