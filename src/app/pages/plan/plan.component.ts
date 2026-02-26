import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { ToolbarModule } from 'primeng/toolbar';
import { CardModule } from 'primeng/card';
import { SelectModule } from 'primeng/select';
import { FileSelectEvent, FileUploadModule } from 'primeng/fileupload';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { TabsModule } from 'primeng/tabs';
import { CheckboxModule } from 'primeng/checkbox';
import { InputTextModule } from 'primeng/inputtext';
import * as XLSX from 'xlsx';
import { timeout } from 'rxjs/operators';
import { EMBEDDED_COMBINED_XLSX_BASE64 } from './embedded-combined.generated';
import { PlanStateService } from './plan-state.service';

export interface PlanRow {
  [key: string]: string | number | boolean | null;
}

/** plan.py: Knowledge base satırı — geçmiş üretimden (Product, Color, Size, Material, Machine) */
export interface KbRow {
  Product: string;
  Color: string;
  Size: string;
  Material: string;
  Machine: string;
}

/** Makine ayarı: arızalı işaretlenenler atama / dahil etme dışı bırakılır */
export interface MachineSetting {
  name: string;
  faulty: boolean; // true = arızalı, dahil etme
}

@Component({
  selector: 'app-plan',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    ToolbarModule,
    CardModule,
    SelectModule,
    FileUploadModule,
    ToastModule,
    TabsModule,
    CheckboxModule,
    InputTextModule,
  ],
  providers: [MessageService],
  templateUrl: './plan.component.html',
})
export class PlanComponent implements OnInit, OnDestroy {
  /** Yüklenen Excel verisi (ilk sayfa veya birleştirilmiş) */
  data: PlanRow[] = [];
  /** Tablo sütunları (ilk satırdan veya veriden türetilir) */
  cols: { field: string; header: string }[] = [];
  /** Seçilen sayfa adı (çok sayfalı Excel için) */
  sheetNames: string[] = [];
  selectedSheet = '';
  /** Analiz özeti */
  summary: { label: string; value: string | number }[] = [];
  loading = false;
  private wb: XLSX.WorkBook | null = null;

  /** Makine sütunu (Maschine / Makine header ile tespit) */
  machineColumnField: string | null = null;
  /** Rating sütunu (atama mantığı için) */
  ratingColumnField: string | null = null;
  /** Reihenfolge sütunu (sıra numarası — atama sonrası doldurulur) */
  reihenfolgeColumnField: string | null = null;
  /** Sadece makine ataması yapılmamış siparişleri göster */
  showOnlyUnassigned = false;
  /** Arızalı makineye atanmış siparişleri tabloda gizle (ayarlardan) */
  hideAssignedToFaulty = true;
  /** Ayarlar: makine listesi ve arızalı işareti (varsayılan: tümü aktif) */
  machineSettings: MachineSetting[] = [];
  /** Ayarlara manuel eklenecek makine adı */
  newMachineName = '';
  /** Aktif sekme: 0 = Veri tablosu, 1 = Ayarlar */
  activeTabIndex: number = 0;
  /** Combined data Excel'den okunan makine listesi (yükleme ile) */
  combinedDataMachines: string[] = [];
  combinedDataFileName = '';
  loadingCombined = false;
  /** plan.py: KB = geçmiş Fertigungsplanung dosyalarından (Product, Color, Size, Material, Machine); NN ile atama */
  kbRows: KbRow[] = [];
  embeddedCombinedLoaded = false;
  embeddedCombinedError = '';
  get embeddedCombinedLookupCount(): number {
    return this.kbRows.length;
  }

  /** Performans: atama ve Reihenfolge veri/KB/ayar değişince bir kez hesaplanır, getter'lar sadece okur */
  private assignedMachineByRowIndex: (string | null)[] = [];
  private reihenfolgeByRowIndex = new Map<number, number>();
  private assignmentCacheValid = false;

  /** Tablo için satır listesi önbelleği — aynı referans dönünce PrimeNG sıralama çalışır */
  private _displayRowsCache: (PlanRow & { _rowIndex: number; _assignedMachine: string | null; _reihenfolge: number | null; _isCurrentFaulty: boolean })[] = [];
  private _displayRowsCacheStale = true;

  /** Arızalı olmayan (aktif) makineler. Combined data'dan geldiyse Excel'deki ilk geçiş sırası korunur (Rating 1 = ilk makine). */
  get activeMachines(): string[] {
    const activeSet = new Set(
      this.machineSettings.filter((m) => !m.faulty).map((m) => m.name)
    );
    if (this.combinedDataMachines.length > 0) {
      return this.combinedDataMachines.filter((name) => activeSet.has(name));
    }
    return Array.from(activeSet).sort((a, b) => a.localeCompare(b));
  }

  /** plan.py: Önce KB ile NN atama (Product, Material, Color, Size benzerliği — combined data'ya göre makine). KB yoksa rating/ilk makine. */
  getAssignedMachine(row: PlanRow): string | null {
    const fromKb = this.getAssignedMachineNN(row);
    if (fromKb != null) return fromKb;
    const active = this.activeMachines;
    if (active.length === 0) return 'M1'; // plan.py: KB yoksa hepsini M1
    const ratingVal = this.ratingColumnField ? row[this.ratingColumnField] : null;
    const rating = typeof ratingVal === 'number' && Number.isFinite(ratingVal) ? Math.max(1, Math.floor(ratingVal)) : null;
    if (rating === null) {
      const s = String(ratingVal ?? '').trim();
      const n = parseInt(s, 10);
      if (Number.isFinite(n) && n >= 1) return active[(n - 1) % active.length];
      return active[0];
    }
    return active[(rating - 1) % active.length];
  }

  /** plan.py assign_machines_nn: KB'de en benzer satırı bul, onun Machine değerini ata. Arızalı makineyi atlama. */
  private getAssignedMachineNN(row: PlanRow): string | null {
    if (this.kbRows.length === 0) return null;
    const faultySet = new Set(this.machineSettings.filter((m) => m.faulty).map((m) => m.name.toLowerCase()));
    const order = this.rowToOrder(row);
    const kbs = this.kbRows.length > 8000 ? this.sample(this.kbRows, 8000) : this.kbRows;
    let best: KbRow | null = null;
    let bestScore = -1;
    for (const kb of kbs) {
      const machine = this.clean(kb.Machine);
      if (faultySet.has(machine.toLowerCase())) continue;
      const s = this.sim(order, kb);
      if (s > bestScore) {
        bestScore = s;
        best = kb;
      }
    }
    return best && this.clean(best.Machine) ? this.clean(best.Machine) : null;
  }

  private sample<T>(arr: T[], n: number): T[] {
    const out: T[] = [];
    const step = Math.max(1, Math.floor(arr.length / n));
    for (let i = 0; i < arr.length && out.length < n; i += step) out.push(arr[i]);
    return out;
  }

  /** plan.py autodetect_columns: sütun adı -> eşleşen header */
  private autodetectColumns(headers: string[]): Record<string, string | null> {
    const lc = new Map<string, string>();
    headers.forEach((h) => {
      const t = String(h ?? '').trim();
      lc.set(t.toLowerCase(), t);
    });
    const pick = (...keys: string[]): string | null => {
      for (const key of keys) {
        const k = key.toLowerCase();
        if (lc.has(k)) return lc.get(k)!;
        for (const [cand, orig] of lc) {
          if (cand.includes(k)) return orig;
        }
      }
      return null;
    };
    return {
      OrderId: pick('OrderId', 'Auftrag', 'Order', 'Bestellung', 'Auftrag Nr', 'Order No', 'No', 'Nr', 'Sipariş', 'Projekt-Nummer', 'Nummer', 'Projekt'),
      Product: pick('Product', 'Artikel', 'Ürün', 'Item', 'Bezeichnung', 'Part', 'Article', 'Materialnummer', 'MatNo', 'Produkt'),
      Color: pick('Color', 'Farbe', 'Renk', 'Color Code', 'Farbcode'),
      Size: pick('Size', 'Maß', 'Boyut', 'Diameter', 'Breite', 'Höhe', 'Ölçü', 'Dimension'),
      Material: pick('Material', 'Werkstoff', 'Malzeme'),
      Machine: (() => {
        const m = pick('Machine', 'Maschine', 'Makine', 'Tezgah', 'Line', 'Linie');
        if (m && !/Material/i.test(m)) return m;
        return null;
      })(),
    };
  }

  private clean(x: string | number | boolean | null | undefined): string {
    const s = String(x ?? '').trim();
    if (['nan', 'nat', 'none'].includes(s.toLowerCase())) return '';
    return s;
  }

  private rowToOrder(row: PlanRow): KbRow {
    const map = this.autodetectColumns(this.cols.map((c) => c.header));
    const get = (key: string) => {
      const header = map[key];
      if (!header) return '';
      const col = this.cols.find((c) => c.header === header);
      return col ? this.clean(row[col.field]) : '';
    };
    return {
      Product: get('Product'),
      Color: get('Color'),
      Size: get('Size'),
      Material: get('Material'),
      Machine: get('Machine'),
    };
  }

  /** plan.py: token overlap (Jaccard benzeri) */
  private tokenOverlap(a: string, b: string): number {
    const tokens = (s: string) => {
      const t = this.clean(s).toLowerCase().replace(/-/g, ' ').replace(/_/g, ' ');
      return new Set(t.split(/\s+/).filter(Boolean));
    };
    const ta = tokens(a);
    const tb = tokens(b);
    if (ta.size === 0 || tb.size === 0) return 0;
    let inter = 0;
    ta.forEach((t) => { if (tb.has(t)) inter++; });
    const union = ta.size + tb.size - inter;
    return union > 0 ? inter / union : 0;
  }

  private sizeNum(s: string): number | null {
    const t = this.clean(s).toLowerCase();
    try {
      const part = t.includes('x') ? t.split('x')[0] : t;
      return parseFloat(part.replace(',', '.'));
    } catch {
      return null;
    }
  }

  /** plan.py sim(): Product (tam +4 / token*3), Color +3, Material +2, Size yakınlık 1.5'e kadar */
  private sim(order: KbRow, kb: KbRow): number {
    let score = 0;
    const op = this.clean(order.Product).toLowerCase();
    const kp = this.clean(kb.Product).toLowerCase();
    if (op && op === kp) score += 4;
    else score += 3 * this.tokenOverlap(order.Product, kb.Product);
    if (this.clean(order.Color) && this.clean(order.Color).toLowerCase() === this.clean(kb.Color).toLowerCase()) score += 3;
    if (this.clean(order.Material) && this.clean(order.Material).toLowerCase() === this.clean(kb.Material).toLowerCase()) score += 2;
    const an = this.sizeNum(order.Size);
    const bn = this.sizeNum(kb.Size);
    if (an != null && bn != null) score += Math.max(0, 1.5 - 0.1 * Math.abs(an - bn));
    else if (this.clean(order.Size) && this.clean(order.Size).toLowerCase() === this.clean(kb.Size).toLowerCase()) score += 0.5;
    return score + 0.01;
  }

  /** Mevcut (Excel'deki) makine arızalı mı? */
  isCurrentMachineFaulty(row: PlanRow): boolean {
    if (!this.machineColumnField) return false;
    const val = row[this.machineColumnField];
    if (this.isEmpty(val)) return false;
    const name = String(val).trim().toLowerCase();
    return this.machineSettings.some((m) => m.faulty && m.name.toLowerCase() === name);
  }

  /** Tüm satırlar için atama ve Reihenfolge'u bir kez hesapla; sonuçlar önbellekte tutulur (performans). */
  private computeAllAssignments(): void {
    const data = this.data;
    this.assignedMachineByRowIndex = data.map((row) => this.getAssignedMachine(row));
    const byMachine = new Map<string, number[]>();
    this.assignedMachineByRowIndex.forEach((m, idx) => {
      if (m) {
        if (!byMachine.has(m)) byMachine.set(m, []);
        byMachine.get(m)!.push(idx);
      }
    });
    this.reihenfolgeByRowIndex.clear();
    Array.from(byMachine.keys()).sort((a, b) => a.localeCompare(b)).forEach((machine) => {
      byMachine.get(machine)!.forEach((idx, i) => this.reihenfolgeByRowIndex.set(idx, i + 1));
    });
    this.assignmentCacheValid = this.assignedMachineByRowIndex.length === data.length;
    this._displayRowsCacheStale = true;
  }

  private refreshDisplayRowsCache(): void {
    const list = this.filteredData;
    const out: (PlanRow & { _rowIndex: number; _assignedMachine: string | null; _reihenfolge: number | null; _isCurrentFaulty: boolean })[] = [];
    for (const row of list) {
      const dataIndex = this.data.indexOf(row);
      const assigned = this.assignedMachineByRowIndex[dataIndex] ?? null;
      const reihenfolge = assigned ? (this.reihenfolgeByRowIndex.get(dataIndex) ?? null) : null;
      const built: PlanRow & { _rowIndex: number; _assignedMachine: string | null; _reihenfolge: number | null; _isCurrentFaulty: boolean } = {
        ...row,
        _rowIndex: dataIndex,
        _assignedMachine: assigned,
        _reihenfolge: reihenfolge,
        _isCurrentFaulty: this.isCurrentMachineFaulty(row),
      };
      if (this.machineColumnField != null) {
        (built as Record<string, unknown>)[this.machineColumnField] = assigned ?? row[this.machineColumnField];
      }
      if (this.reihenfolgeColumnField != null) {
        (built as Record<string, unknown>)[this.reihenfolgeColumnField] = reihenfolge ?? row[this.reihenfolgeColumnField];
      }
      out.push(built);
    }
    this._displayRowsCache = out;
    this._displayRowsCacheStale = false;
  }

  /** Tabloda gösterilecek satırlar; aynı dizi referansı döner ki PrimeNG sıralama çalışsın */
  get displayRows(): (PlanRow & { _rowIndex: number; _assignedMachine: string | null; _reihenfolge: number | null; _isCurrentFaulty: boolean })[] {
    if (!this.assignmentCacheValid) this.computeAllAssignments();
    if (this._displayRowsCacheStale) this.refreshDisplayRowsCache();
    return this._displayRowsCache;
  }

  /** Filtre değişince tablo önbelleğini yenile */
  onFilterChange(): void {
    this._displayRowsCacheStale = true;
  }

  /** PrimeNG customSort: Maschine/Reihenfolge sayısal, diğerleri metin; sıralama gerçekten uygulanır */
  onTableSort(event: { data: unknown[]; field: string; order: number }): void {
    const field = event.field;
    const order = event.order;
    const isNumeric = field === this.machineColumnField || field === this.reihenfolgeColumnField;
    event.data.sort((a: unknown, b: unknown) => {
      const rowA = a as Record<string, unknown>;
      const rowB = b as Record<string, unknown>;
      let valA = rowA[field];
      let valB = rowB[field];
      let result: number;
      if (valA == null && valB == null) result = 0;
      else if (valA == null) result = -1;
      else if (valB == null) result = 1;
      else if (isNumeric) {
        const numA = typeof valA === 'number' ? valA : parseFloat(String(valA));
        const numB = typeof valB === 'number' ? valB : parseFloat(String(valB));
        const na = Number.isFinite(numA);
        const nb = Number.isFinite(numB);
        if (!na && !nb) result = String(valA).localeCompare(String(valB));
        else if (!na) result = -1;
        else if (!nb) result = 1;
        else result = numA < numB ? -1 : numA > numB ? 1 : 0;
      } else {
        result = String(valA).localeCompare(String(valB), undefined, { numeric: true });
      }
      return order * result;
    });
  }

  /** Tabloda gösterilecek veri (filtreler uygulanmış); önbellek kullanır */
  get filteredData(): PlanRow[] {
    if (!this.assignmentCacheValid) this.computeAllAssignments();
    let list = this.data;
    if (this.showOnlyUnassigned && this.assignedMachineByRowIndex.length === this.data.length) {
      list = list.filter((_, idx) => this.assignedMachineByRowIndex[idx] === null);
    } else if (this.showOnlyUnassigned) {
      list = list.filter((r) => this.getAssignedMachine(r) === null);
    }
    if (this.hideAssignedToFaulty && this.machineColumnField) {
      const faultySet = new Set(
        this.machineSettings.filter((m) => m.faulty).map((m) => String(m.name).trim().toLowerCase())
      );
      list = list.filter((r) => {
        const val = r[this.machineColumnField!];
        if (this.isEmpty(val)) return true;
        return !faultySet.has(String(val).trim().toLowerCase());
      });
    }
    return list;
  }

  /** Rating'e göre atanmamış sipariş sayısı; önbellek kullanır */
  get unassignedCount(): number {
    if (!this.assignmentCacheValid) this.computeAllAssignments();
    if (this.assignedMachineByRowIndex.length === this.data.length) {
      return this.assignedMachineByRowIndex.filter((m) => m == null).length;
    }
    return this.data.filter((r) => this.getAssignedMachine(r) === null).length;
  }

  private isEmpty(v: string | number | boolean | null | undefined): boolean {
    if (v === null || v === undefined) return true;
    if (typeof v === 'string' && v.trim() === '') return true;
    return false;
  }

  constructor(
    private msg: MessageService,
    private http: HttpClient,
    private planState: PlanStateService,
  ) {}

  ngOnInit(): void {
    if (this.planState.hasState()) {
      this.restoreState();
    } else {
      this.loadEmbeddedCombinedData();
    }
  }

  ngOnDestroy(): void {
    if (this.data.length > 0 || this.kbRows.length > 0) {
      this.saveState();
    }
  }

  private saveState(): void {
    this.planState.setState({
      data: this.data,
      cols: this.cols,
      sheetNames: this.sheetNames,
      selectedSheet: this.selectedSheet,
      kbRows: this.kbRows,
      combinedDataMachines: this.combinedDataMachines,
      combinedDataFileName: this.combinedDataFileName,
      machineSettings: this.machineSettings,
      machineColumnField: this.machineColumnField,
      ratingColumnField: this.ratingColumnField,
      reihenfolgeColumnField: this.reihenfolgeColumnField,
      embeddedCombinedLoaded: this.embeddedCombinedLoaded,
      embeddedCombinedError: this.embeddedCombinedError,
      summary: this.summary,
    });
  }

  private restoreState(): void {
    const s = this.planState.getState();
    if (!s) return;
    this.data = s.data as PlanRow[];
    this.cols = s.cols;
    this.sheetNames = s.sheetNames;
    this.selectedSheet = s.selectedSheet;
    this.kbRows = s.kbRows as KbRow[];
    this.combinedDataMachines = s.combinedDataMachines;
    this.combinedDataFileName = s.combinedDataFileName;
    this.machineSettings = s.machineSettings as MachineSetting[];
    this.machineColumnField = s.machineColumnField;
    this.ratingColumnField = s.ratingColumnField;
    this.reihenfolgeColumnField = s.reihenfolgeColumnField;
    this.embeddedCombinedLoaded = s.embeddedCombinedLoaded;
    this.embeddedCombinedError = s.embeddedCombinedError;
    this.summary = s.summary;
    this._displayRowsCacheStale = true;
    this.assignmentCacheValid = false;
    if (this.data.length > 0) this.computeAllAssignments();
    this.updateSummary();
  }

  /** Önce bundle içine gömülü combined data kullan (publish'te her zaman var); yoksa assets'ten yükle. Timeout ile asılı kalma önlenir. */
  private loadEmbeddedCombinedData(): void {
    const embeddedB64: string = EMBEDDED_COMBINED_XLSX_BASE64;
    if (embeddedB64 && embeddedB64.length > 0) {
      try {
        const binary = atob(embeddedB64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
        this.applyCombinedDataFromBuffer(bytes.buffer);
        return;
      } catch (e) {
        this.embeddedCombinedError = 'Gömülü combined data okunamadı: ' + String(e);
      }
    }
    this.http
      .get('assets/plan/Fertigungsplanung_combined.xlsx', { responseType: 'arraybuffer' })
      .pipe(timeout(8000))
      .subscribe({
        next: (ab) => this.applyCombinedDataFromBuffer(ab),
        error: (err) => {
          this.embeddedCombinedLoaded = false;
          const isTimeout = err?.name === 'TimeoutError' || err?.message?.includes('timeout');
          this.embeddedCombinedError = isTimeout
            ? 'Combined data isteği zaman aşımına uğradı.'
            : err?.status === 404
              ? 'Combined data yok. Fertigungsplanung_combined.xlsx dosyasını src/assets/plan/ içine koyup "npm run build" çalıştırın.'
              : String(err?.message ?? err);
        },
      });
  }

  private applyCombinedDataFromBuffer(ab: ArrayBuffer): void {
    try {
      const wb = XLSX.read(ab, { type: 'array' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      if (!ws) return;
      const raw: unknown[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
      this.kbRows = this.buildKbRows(raw);
      this.embeddedCombinedLoaded = true;
      this.embeddedCombinedError = '';
      if (this.kbRows.length > 0) {
        this.combinedDataMachines = Array.from(new Set(this.kbRows.map((r) => this.clean(r.Machine)).filter(Boolean))).sort((a, b) => a.localeCompare(b));
        this.syncMachineSettingsFromData();
        if (this.data.length > 0) this.computeAllAssignments();
        this.msg.add({
          severity: 'success',
          summary: 'Combined data (KB) yüklendi',
          detail: `${this.kbRows.length} satır — plan.py gibi en yakın komşu (NN) ile makine ataması`,
        });
      }
    } catch (e) {
      this.embeddedCombinedError = String(e);
    }
  }

  /** plan.py / make_combined: Başlık satırı ilk satırda değilse (örn. FB086'da satır 3) ilk 30 satırda ara */
  private findHeaderRowForKb(raw: unknown[][]): number {
    const aliasKeys: Record<string, string[]> = {
      product: ['product', 'artikel', 'ürün', 'produkt', 'item', 'bezeichnung', 'part', 'article', 'materialnummer', 'matno'],
      color: ['color', 'farbe', 'renk', 'farbcode', 'colour'],
      size: ['size', 'maß', 'mass', 'boyut', 'dimension', 'diameter', 'breite', 'höhe', 'länge'],
      material: ['material', 'werkstoff', 'malzeme'],
      machine: ['maschine', 'makine', 'machine', 'tezgah', 'line', 'linie'],
    };
    const scanRows = Math.min(30, raw.length);
    let bestRow = 0;
    let bestScore = -1;
    for (let r = 0; r < scanRows; r++) {
      const row = raw[r] as unknown[] | undefined;
      if (!row || !Array.isArray(row)) continue;
      const cells = row.map((c) => String(c ?? '').trim().toLowerCase());
      let matched = 0;
      let hasMachine = false;
      for (const [key, aliases] of Object.entries(aliasKeys)) {
        if (key === 'machine') {
          for (const cell of cells) {
            if (/material/i.test(cell)) continue;
            if (aliases.some((a) => cell.includes(a))) {
              hasMachine = true;
              matched++;
              break;
            }
          }
        } else {
          if (aliases.some((alias) => cells.some((cell) => cell.includes(alias)))) matched++;
        }
      }
      if (hasMachine && matched > bestScore) {
        bestScore = matched;
        bestRow = r;
      }
    }
    return bestRow;
  }

  /** plan.py build_kb: Geçmiş Excel'den Product, Color, Size, Material, Machine; sadece Machine dolu satırlar. Başlık satırı otomatik tespit (FB086 uyumlu). */
  private buildKbRows(raw: unknown[][]): KbRow[] {
    const rows: KbRow[] = [];
    if (raw.length < 2) return rows;
    let headerRowIndex = 0;
    let header = (raw[0] as string[]).map((h) => String(h ?? '').trim());
    let map = this.autodetectColumns(header);
    if (!map['Machine'] && raw.length > 5) {
      headerRowIndex = this.findHeaderRowForKb(raw);
      header = (raw[headerRowIndex] as string[]).map((h) => String(h ?? '').trim());
      map = this.autodetectColumns(header);
    }
    const machineHeader = map['Machine'];
    if (!machineHeader) return rows;
    const colIdx = (key: string): number => {
      const h = map[key];
      if (!h) return -1;
      const i = header.findIndex((x) => String(x ?? '').trim() === h);
      return i;
    };
    const idx = { Product: colIdx('Product'), Color: colIdx('Color'), Size: colIdx('Size'), Material: colIdx('Material'), Machine: colIdx('Machine') };
    if (idx.Machine < 0) return rows;
    const get = (row: unknown[], i: number) => (i >= 0 ? this.clean(row[i] as string) : '');
    for (let r = headerRowIndex + 1; r < raw.length; r++) {
      const row = raw[r] as unknown[];
      const machine = get(row, idx.Machine);
      if (!machine) continue;
      rows.push({
        Product: get(row, idx.Product),
        Color: get(row, idx.Color),
        Size: get(row, idx.Size),
        Material: get(row, idx.Material),
        Machine: machine,
      });
    }
    return rows;
  }

  /** Sütun adı Material ise makine sütunu DEĞİLDİR. Sadece Maschine/Makine/Machine kullanılır. */
  private isMachineColumnHeader(h: string): boolean {
    const t = String(h).trim().replace(/\s+/g, ' ');
    if (/Material/i.test(t)) return false;
    return /Maschine|Makine|Machine/i.test(t);
  }

  onFileSelect(event: FileSelectEvent) {
    const file = event.currentFiles?.[0];
    if (!file) return;
    this.loading = true;
    this.data = [];
    this.cols = [];
    this.sheetNames = [];
    this.selectedSheet = '';
    this.summary = [];

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const ab = e.target?.result as ArrayBuffer;
        const wb = XLSX.read(ab, { type: 'array' });
        this.sheetNames = wb.SheetNames;

        if (wb.SheetNames.length === 0) {
          this.msg.add({ severity: 'warn', summary: 'Excel boş', detail: 'Sayfa bulunamadı.' });
          this.loading = false;
          return;
        }

        this.wb = wb;
        this.selectedSheet = wb.SheetNames[0];
        this.loadSheet(wb, this.selectedSheet);
      } catch (err) {
        this.msg.add({ severity: 'error', summary: 'Excel okunamadı', detail: String(err) });
      }
      this.loading = false;
    };
    reader.readAsArrayBuffer(file);
  }

  /** Combined data Excel yükle — makine listesi (SL4066 vb.) bu dosyadan okunur, rating ataması buna göre yapılır */
  onCombinedDataSelect(event: FileSelectEvent) {
    const file = event.currentFiles?.[0];
    if (!file) return;
    this.loadingCombined = true;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const ab = e.target?.result as ArrayBuffer;
        const wb = XLSX.read(ab, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        if (!ws) {
          this.msg.add({ severity: 'warn', summary: 'Combined data', detail: 'Sayfa bulunamadı.' });
          this.loadingCombined = false;
          return;
        }
        const raw: unknown[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
        this.kbRows = this.buildKbRows(raw);
        this.combinedDataMachines = this.kbRows.length > 0
          ? Array.from(new Set(this.kbRows.map((r) => this.clean(r.Machine)).filter(Boolean))).sort((a, b) => a.localeCompare(b))
          : [];
        this.combinedDataFileName = file.name;
        this.embeddedCombinedLoaded = true;
        this.syncMachineSettingsFromData();
        if (this.data.length > 0) this.computeAllAssignments();
        this.updateSummary();
        this.msg.add({
          severity: 'success',
          summary: 'Combined data (KB) yüklendi',
          detail: `${this.kbRows.length} satır — NN ile makine ataması (${file.name})`,
        });
      } catch (err) {
        this.msg.add({ severity: 'error', summary: 'Combined data okunamadı', detail: String(err) });
      }
      this.loadingCombined = false;
    };
    reader.readAsArrayBuffer(file);
  }

  /** Excel sayfasından sadece Makine sütunundaki kodları toplar (Material sütunu hariç — Material malzeme, makine değil). */
  private extractMachineListFromSheet(raw: unknown[][]): string[] {
    const order: string[] = [];
    const seen = new Set<string>();
    const add = (s: string) => {
      const key = s.trim();
      if (key && !seen.has(key)) {
        seen.add(key);
        order.push(key);
      }
    };
    if (raw.length < 2) return [];
    const header = (raw[0] as string[]).map((h) => String(h ?? '').trim());
    let machineCol = header.findIndex((h) => this.isMachineColumnHeader(h));
    if (machineCol < 0) {
      const slPattern = /^SL\d+/i;
      for (let c = 0; c < header.length; c++) {
        if (/Material/i.test(header[c])) continue;
        let score = 0;
        for (let r = 1; r < Math.min(raw.length, 50); r++) {
          const v = (raw[r] as unknown[])[c];
          if (v != null && slPattern.test(String(v).trim())) score++;
        }
        if (score > 0) {
          machineCol = c;
          break;
        }
      }
    }
    if (machineCol >= 0) {
      for (let r = 1; r < raw.length; r++) {
        const v = (raw[r] as unknown[])[machineCol];
        const s = String(v ?? '').trim();
        if (s) add(s);
      }
    }
    return order;
  }

  onSheetChange() {
    if (!this.selectedSheet || !this.wb) return;
    this.loadSheet(this.wb, this.selectedSheet);
  }

  loadSheet(wb: XLSX.WorkBook, sheetName: string) {
    const ws = wb.Sheets[sheetName];
    if (!ws) return;
    const raw: unknown[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
    if (raw.length === 0) {
      this.data = [];
      this.cols = [];
      this.updateSummary();
      return;
    }

    const headerRow = raw[0] as string[];
    this.cols = headerRow.map((h, i) => ({ field: `col_${i}`, header: String(h || `Sütun ${i + 1}`) }));

    const rows: PlanRow[] = [];
    for (let r = 1; r < raw.length; r++) {
      const row = raw[r] as unknown[];
      const obj: PlanRow = {};
      this.cols.forEach((c, i) => {
        obj[c.field] = row[i] !== undefined && row[i] !== null && row[i] !== '' ? row[i] as string | number | boolean : null;
      });
      rows.push(obj);
    }
    this.data = rows;
    this.detectMachineColumn();
    this.detectRatingColumn();
    this.detectReihenfolgeColumn();
    this.syncMachineSettingsFromData();
    this.computeAllAssignments();
    this.updateSummary();
  }

  private detectMachineColumn(): void {
    const headerOk = (c: { header: string }) => this.isMachineColumnHeader(c.header);
    let idx = this.cols.findIndex(headerOk);
    if (idx >= 0) {
      this.machineColumnField = this.cols[idx].field;
      return;
    }
    const slPattern = /^SL\d+/i;
    for (let c = 0; c < this.cols.length; c++) {
      if (/Material/i.test(String(this.cols[c].header))) continue;
      const field = this.cols[c].field;
      let matchCount = 0;
      const sample = this.data.slice(0, Math.min(10, this.data.length));
      for (const row of sample) {
        const v = row[field];
        if (!this.isEmpty(v) && slPattern.test(String(v).trim())) matchCount++;
      }
      if (sample.length > 0 && matchCount >= sample.length * 0.5) {
        this.machineColumnField = field;
        return;
      }
    }
    this.machineColumnField = null;
  }

  private detectRatingColumn(): void {
    const idx = this.cols.findIndex(
      (c) => /^Rating$/i.test(String(c.header).trim())
    );
    this.ratingColumnField = idx >= 0 ? this.cols[idx].field : null;
  }

  private detectReihenfolgeColumn(): void {
    const idx = this.cols.findIndex(
      (c) => /Reihenfolge|Sıra|Sequence|Reihe/i.test(String(c.header).trim())
    );
    this.reihenfolgeColumnField = idx >= 0 ? this.cols[idx].field : null;
  }

  /** Verideki veya combined data'daki makine listesini ayarlara yazar; arızalı işaretlerini korur. Combined data varsa öncelik ondadır. */
  private syncMachineSettingsFromData(): void {
    const existingFaulty = new Set(
      this.machineSettings.filter((m) => m.faulty).map((m) => m.name.toLowerCase())
    );
    let newList: MachineSetting[] = [];

    if (this.combinedDataMachines.length > 0) {
      newList = this.combinedDataMachines.map((name) => ({
        name,
        faulty: existingFaulty.has(name.toLowerCase()),
      }));
    } else {
      const fromData = new Set<string>();
      if (this.machineColumnField) {
        this.data.forEach((r) => {
          const v = r[this.machineColumnField!];
          if (!this.isEmpty(v)) fromData.add(String(v).trim());
        });
      }
      if (fromData.size > 0) {
        fromData.forEach((name) => {
          newList.push({ name, faulty: existingFaulty.has(name.toLowerCase()) });
        });
      } else {
        const maxRating = this.getMaxRatingFromData();
        if (maxRating >= 1) {
          for (let i = 1; i <= maxRating; i++) {
            newList.push({ name: `Makine ${i}`, faulty: existingFaulty.has(`makine ${i}`) });
          }
        }
        if (newList.length === 0) {
          newList.push({ name: 'M1', faulty: false }); // plan.py: KB/veri yoksa varsayılan M1
        }
      }
    }
    this.machineSettings.forEach((m) => {
      if (!newList.some((n) => n.name.toLowerCase() === m.name.toLowerCase())) {
        newList.push({ name: m.name, faulty: m.faulty });
      }
    });
    this.machineSettings = newList.sort((a, b) => a.name.localeCompare(b.name));
  }

  private getMaxRatingFromData(): number {
    if (!this.ratingColumnField) return 0;
    let max = 0;
    this.data.forEach((r) => {
      const v = r[this.ratingColumnField!];
      const n = typeof v === 'number' ? (Number.isFinite(v) ? Math.floor(v) : 0) : parseInt(String(v ?? ''), 10);
      if (Number.isFinite(n) && n > max) max = n;
    });
    return max;
  }

  addMachine(): void {
    const name = this.newMachineName?.trim();
    if (!name) return;
    if (this.machineSettings.some((m) => m.name.toLowerCase() === name.toLowerCase())) {
      this.msg.add({ severity: 'warn', summary: 'Makine zaten var', detail: name });
      return;
    }
    this.machineSettings = [...this.machineSettings, { name, faulty: false }].sort((a, b) => a.name.localeCompare(b.name));
    this.newMachineName = '';
    if (this.data.length > 0) this.computeAllAssignments();
    this.msg.add({ severity: 'success', summary: 'Makine eklendi', detail: name });
  }

  removeMachine(m: MachineSetting): void {
    this.machineSettings = this.machineSettings.filter((x) => x.name !== m.name);
    if (this.data.length > 0) this.computeAllAssignments();
  }

  /** Arızalı işareti değişince atamaları yeniden hesapla (performans için önbellek güncellenir) */
  onFaultyChange(): void {
    this.machineSettings = [...this.machineSettings];
    if (this.data.length > 0) this.computeAllAssignments();
  }

  private updateSummary() {
    this.summary = [
      { label: 'Toplam satır', value: this.data.length },
      { label: 'Toplam sütun', value: this.cols.length },
    ];
    if (this.ratingColumnField !== null || this.machineColumnField !== null) {
      this.summary.push({ label: "Atanmamış sipariş (rating'e göre)", value: this.unassignedCount });
    }

    // Sayı içeren sütunlar için toplam/ortalama
    if (this.data.length > 0 && this.cols.length > 0) {
      this.cols.forEach((c, i) => {
        const vals = this.data.map((r) => r[c.field]);
        const nums = vals.filter((v) => typeof v === 'number') as number[];
        if (nums.length > 0) {
          const sum = nums.reduce((a, b) => a + b, 0);
          this.summary.push({ label: `${c.header} (toplam)`, value: sum.toFixed(2) });
          this.summary.push({ label: `${c.header} (ortalama)`, value: (sum / nums.length).toFixed(2) });
        }
      });
    }
  }

  clearData() {
    this.data = [];
    this.cols = [];
    this.sheetNames = [];
    this.selectedSheet = '';
    this.summary = [];
    this.machineColumnField = null;
    this.ratingColumnField = null;
    this.reihenfolgeColumnField = null;
    this.machineSettings = [];
    this.assignedMachineByRowIndex = [];
    this.reihenfolgeByRowIndex.clear();
    this.assignmentCacheValid = false;
    this._displayRowsCache = [];
    this._displayRowsCacheStale = true;
    this.combinedDataMachines = [];
    this.combinedDataFileName = '';
    this.kbRows = [];
    this.wb = null;
    this.planState.clear();
    this.msg.add({ severity: 'info', summary: 'Veri temizlendi' });
  }

  exportCsv() {
    const rows = this.displayRows;
    if (rows.length === 0) return;
    const headers = this.cols.map((c) => c.header);
    const dataRows = rows.map((r) => this.cols.map((c) => this.getCellDisplay(r, c) ?? '').join(','));
    const csv = [headers.join(','), ...dataRows].map((line) => `"${String(line).replace(/"/g, '""')}"`).join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    this.downloadBlob(blob, `plan_${new Date().toISOString().slice(0, 10)}.csv`);
  }

  exportExcel() {
    const rows = this.displayRows;
    if (rows.length === 0) return;
    const wsData: unknown[][] = [this.cols.map((c) => c.header)];
    rows.forEach((r) => wsData.push(this.cols.map((c) => this.getCellDisplay(r, c) ?? '')));
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Plan');
    XLSX.writeFile(wb, `plan_${new Date().toISOString().slice(0, 10)}.xlsx`);
  }

  /** Tabloda/export'ta hücre değeri: Maschine/Reihenfolge sütunlarında atanan değer öncelikli */
  getCellDisplay(row: PlanRow & { _assignedMachine?: string | null; _reihenfolge?: number | null }, c: { field: string; header: string }): string | number | boolean | null {
    if (this.machineColumnField && c.field === this.machineColumnField && (row as { _assignedMachine?: string | null })._assignedMachine != null) {
      return (row as { _assignedMachine: string })._assignedMachine;
    }
    if (this.reihenfolgeColumnField && c.field === this.reihenfolgeColumnField && (row as { _reihenfolge?: number | null })._reihenfolge != null) {
      return (row as { _reihenfolge: number })._reihenfolge;
    }
    return row[c.field] ?? null;
  }

  private downloadBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }
}
