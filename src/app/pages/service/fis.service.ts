import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { URETIM_FIS } from './uretim-fis.data';

export interface Product {
  id?: string;
  code?: string;
  name?: string;
  description?: string;
  price?: number;
  quantity?: number;
  inventoryStatus?: string;
  category?: string;
  image?: string;
  rating?: number;
  
  karantinaGiris?: string;
  karantinaCikis?: string;
  isemriNo?: string;
  isIstasyonuNo?: string;
  isIstasyonuAdi?: string;
  ekipmanNo?: string;
  miktar?: number;
  redMiktar?: number;
  planFisRef?: number;
}

type InventoryStatus = 'OUTOFSTOCK' | 'INSTOCK' | 'LOWSTOCK';

export interface UretimFisDto {
  "Fiş No": string;
  "Kayıt Zamanı": string;
  "Tarih": string;
  "İşemri No": string;
  "İş İstasyonu No": string;
  "İş İstayonu Adı": string;
  "Miktar": number;
  "Stok No": string;
  "Stok Adı": string;
  "Ekipman No": string;
  "Red Miktar": number;
  "Plan Fiş Referansı": number;
}

interface UretimFisResponse {
  "Uretim_Fisleri": UretimFisDto[];
}

@Injectable({ providedIn: 'root' })
export class FisService {
  status: InventoryStatus[] = ['OUTOFSTOCK', 'INSTOCK', 'LOWSTOCK'];

  constructor(private http: HttpClient) {}

  
  getProductsMini() {
    return this.getProducts().then(x => x.slice(0, 5));
  }

  getProductsSmall() {
    return this.getProducts().then(x => x.slice(0, 10));
  }

  getProducts() {
    return this.loadFromApi().catch(() => this.loadFromStatic());
  }

  private async loadFromJson(): Promise<Product[]> {
    const candidates = [
      'assets/uretim_fisleri.json',
      'assets/products.json',
      'assets/data/products.json'
    ];

    let res: UretimFisResponse | null = null;
    for (const url of candidates) {
      try {
        const attempt = await firstValueFrom(this.http.get<UretimFisResponse>(url));
        if (attempt && Array.isArray((attempt as any).Uretim_Fisleri)) {
          res = attempt;
          break;
        }
      } catch {
      }
    }

    const rows = res?.Uretim_Fisleri ?? [];
    return rows.map(r => this.mapToProduct(r));
  }

  private async loadFromStatic(): Promise<Product[]> {
    const rows = URETIM_FIS;
    return rows.map(r => this.mapToProduct(r));
  }

  private async loadFromApi(): Promise<Product[]> {
    try {
      const rows = await firstValueFrom(this.http.get<UretimFisDto[]>('/api/fis'));
      return (rows ?? []).map(r => this.mapToProduct(r as any));
    } catch {
      return this.loadFromStatic();
    }
  }

  private mapToProduct(r: UretimFisDto): Product {
    const qty = this.toNumber(r["Miktar"]);
    const reject = this.toNumber(r["Red Miktar"]);
    const netQty = Math.max(0, qty - reject);

    const product: Product = {
      id: r["Fiş No"],              
      code: r["Stok No"],           
      name: r["Stok Adı"],          
      
      quantity: netQty,
      inventoryStatus: this.calcStatus(netQty),
      rating: this.calcRating(qty, reject),
      price: undefined,
      image: undefined,
      
      karantinaGiris: r["Kayıt Zamanı"] ?? '',
      karantinaCikis: '',
      isemriNo: r["İşemri No"],
      isIstasyonuNo: r["İş İstasyonu No"],
      isIstasyonuAdi: r["İş İstayonu Adı"],
      ekipmanNo: r["Ekipman No"],
      miktar: qty,
      redMiktar: reject,
      planFisRef: this.toNumber(r["Plan Fiş Referansı"]),
      
      description: ''
    };

    return product;
  }

  private buildDescription(r: UretimFisDto): string {
    
    const tarih = this.toDateOnly(r["Tarih"]);
    return [
      `Work Order: ${r["İşemri No"]}`,
      `Station: ${r["İş İstasyonu No"]}`,
      `Date: ${tarih}`,
      `Equipment: ${r["Ekipman No"]}`,
      `PlanRef: ${r["Plan Fiş Referansı"]}`
    ].join(' | ');
  }

  private calcStatus(netQty: number): InventoryStatus {
    if (netQty <= 0) return 'OUTOFSTOCK';
    if (netQty < 20) return 'LOWSTOCK';
    return 'INSTOCK';
  }

  private calcRating(qty: number, reject: number): number {
    
    if (qty <= 0) return 1;
    const rejectRate = reject / qty; // 0..1
    if (rejectRate === 0) return 5;
    if (rejectRate <= 0.02) return 4;
    if (rejectRate <= 0.05) return 3;
    if (rejectRate <= 0.10) return 2;
    return 1;
  }

  private toNumber(v: any): number {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  }

  private toDateOnly(s: string): string {
    return s?.includes('T') ? s.split('T')[0] : (s ?? '');
  }
}