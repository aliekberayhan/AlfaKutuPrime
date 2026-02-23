import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { ToolbarModule } from 'primeng/toolbar';
import { FormsModule } from '@angular/forms';
import { TagModule } from 'primeng/tag';
import { OrdersService, Order } from '../service/orders.service';

@Component({
  selector: 'app-sales-orders',
  standalone: true,
  imports: [CommonModule, TableModule, ButtonModule, DialogModule, FormsModule, TagModule, ToolbarModule],
  template: `
    
      <div class="mb-6">
        <div class="bg-white border rounded-lg p-4 shadow-sm">
          <div class="flex items-center justify-between">
            <div>
              <div class="text-2xl font-extrabold text-surface-900">Customer Orders (Sales)</div>
              <div class="text-sm text-surface-600 mt-1">View and manage customer orders — update status, export or inspect details.</div>
            </div>
          </div>
        </div>
      </div>

      <p-table [value]="orders()" [paginator]="true" [rows]="10" dataKey="id">
        <ng-template pTemplate="header">
          <tr>
            <th>Order</th>
            <th>Customer</th>
            <th>Date</th>
            <th>Status</th>
            <th>Total</th>
            <th></th>
          </tr>
        </ng-template>
        <ng-template pTemplate="body" let-o>
          <tr>
            <td>{{o.id}}</td>
            <td>{{o.customer}}</td>
            <td>{{o.date | date:'short'}}</td>
            <td><p-tag [value]="o.status" [severity]="getSeverity(o.status)"></p-tag></td>
            <td>{{calcTotal(o) | currency}}</td>
            <td>
              <p-button icon="pi pi-eye" class="mr-2" (onClick)="view(o)"></p-button>
              <p-button icon="pi pi-send" (onClick)="markShipped(o)" [disabled]="o.status==='Shipped'"></p-button>
            </td>
          </tr>
        </ng-template>
      </p-table>

      <p-dialog header="Order Details" [(visible)]="dialog" [modal]="true" [style]="{ width: '860px' }" [closable]="true">
        <div *ngIf="selected" class="grid grid-cols-12 gap-6">
          <div class="col-span-12 lg:col-span-8">
            <div class="flex items-start justify-between mb-4">
              <div>
                <div class="text-lg font-semibold">{{selected.id}} — {{selected.customer}}</div>
                <div class="text-sm text-surface-600">Date: {{selected.date | date:'short'}}</div>
              </div>
              <div class="text-right">
                <p-tag [value]="selected.status" [severity]="getSeverity(selected.status)"></p-tag>
              </div>
            </div>

            <div class="overflow-auto border rounded">
              <table class="w-full table-fixed">
                <thead class="bg-surface-100">
                  <tr>
                    <th class="text-left px-4 py-3">Product</th>
                    <th class="w-24 text-right px-4 py-3">Qty</th>
                    <th class="w-28 text-right px-4 py-3">Price</th>
                    <th class="w-32 text-right px-4 py-3">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let it of selected.items" class="border-t">
                    <td class="px-4 py-3">{{it.product}}</td>
                    <td class="text-right px-4 py-3">{{it.qty}}</td>
                    <td class="text-right px-4 py-3">{{it.price | currency}}</td>
                    <td class="text-right px-4 py-3">{{it.qty * it.price | currency}}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <aside class="col-span-12 lg:col-span-4">
            <div class="p-4 bg-surface-50 rounded shadow-sm">
              <div class="text-sm text-surface-600 mb-2">Summary</div>
              <div class="flex justify-between mb-2"><div>Items</div><div>{{selected.items.length}}</div></div>
              <div class="flex justify-between mb-2"><div>Subtotal</div><div>{{calcTotal(selected) | currency}}</div></div>
              <div class="flex justify-between font-semibold text-lg mt-4"><div>Total</div><div>{{calcTotal(selected) | currency}}</div></div>
              <div class="mt-6 space-y-2">
                <div class="flex gap-2">
                  <select [(ngModel)]="selected.status" class="p-2 border rounded flex-1">
                    <option value="Open">Open</option>
                    <option value="Pending">Pending</option>
                    <option value="Shipped">Shipped</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                  <p-button label="Save" icon="pi pi-check" (onClick)="saveStatus()"></p-button>
                </div>
                <div class="flex gap-2">
                  <p-button label="Export PDF" icon="pi pi-file-pdf" (onClick)="exportOrderPdf()"></p-button>
                  <p-button label="Close" class="p-button-text" (onClick)="dialog=false"></p-button>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </p-dialog>
    
  `
})
export class SalesOrdersComponent implements OnInit {
  orders = signal<Order[]>([]);
  selected: Order | null = null;
  dialog = false;

  constructor(private svc: OrdersService) {}

  ngOnInit(): void {
    this.orders.set(this.svc.getAll());
  }

  calcTotal(o: Order) {
    return o.items.reduce((s, i) => s + i.qty * i.price, 0);
  }

  view(o: Order) {
    this.selected = o;
    this.dialog = true;
  }

  markShipped(o: Order) {
    this.svc.updateStatus(o.id, 'Shipped');
    this.orders.set(this.svc.getAll());
  }
  saveStatus() {
    if (!this.selected) return;
    this.svc.updateStatus(this.selected.id, this.selected.status);
    this.orders.set(this.svc.getAll());
  }

  exportOrderPdf() {
    if (!this.selected) return;
    const o = this.selected;
    const logo = 'https://www.alfakutu.com/wp-content/uploads/2020/01/Antet-06.01.2020-1.png';
    const itemsHtml = o.items.map(it => `
      <tr>
        <td style="padding:8px;border-bottom:1px solid #eee;">${it.product}</td>
        <td style="padding:8px;border-bottom:1px solid #eee;text-align:right;">${it.qty}</td>
        <td style="padding:8px;border-bottom:1px solid #eee;text-align:right;">${it.price.toFixed(2)}</td>
        <td style="padding:8px;border-bottom:1px solid #eee;text-align:right;">${(it.qty*it.price).toFixed(2)}</td>
      </tr>
    `).join('');
    const html = `<!doctype html>
      <html>
      <head>
        <meta charset="utf-8" />
        <title>Order ${o.id}</title>
        <style>
          body { font-family: Arial, sans-serif; color:#222; padding:24px; }
          .header { display:flex; align-items:center; justify-content:space-between; gap:12px; }
          .logo { max-height:60px; }
          .title { font-size:20px; font-weight:700; margin-bottom:4px; }
          .meta { color:#666; font-size:13px; }
          .card { border-radius:8px; padding:12px; box-shadow:0 1px 2px rgba(0,0,0,0.04); background:#fff; }
          table { width:100%; border-collapse:collapse; margin-top:18px; }
          th, td { padding:10px 8px; border-bottom:1px solid #eee; }
          th { text-align:left; background:#f7f7f7; font-weight:600; }
          .right { text-align:right; }
          .totals { margin-top:18px; display:flex; justify-content:flex-end; gap:12px; font-weight:700; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="title">Order ${o.id}</div>
            <div class="meta">${o.customer} — ${new Date(o.date).toLocaleString()}</div>
          </div>
          <div><img src="${logo}" class="logo" /></div>
        </div>
        <div class="card">
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th class="right">Qty</th>
                <th class="right">Price</th>
                <th class="right">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>
          <div class="totals">Total: ${this.calcTotal(o).toFixed(2)}</div>
        </div>
      </body>
      </html>`;

    const newWin = window.open('', '_blank', 'noopener,noreferrer');
    if (!newWin) return;
    // write and ensure print runs after resources load
    newWin.document.open();
    newWin.document.write(html);
    newWin.document.close();

    const tryPrint = () => {
      try {
        const img = newWin.document.querySelector('img.logo') as HTMLImageElement | null;
        if (!img) {
          // if DOM not ready yet, retry shortly
          setTimeout(tryPrint, 150);
          return;
        }
        const doPrint = () => {
          try { newWin.focus(); newWin.print(); } catch { /* ignore */ }
        };
        if (img.complete) {
          doPrint();
        } else {
          img.onload = doPrint;
          // fallback in case onload never fires
          setTimeout(doPrint, 1500);
        }
      } catch {
        // if cross-window access blocked, try a delayed print
        setTimeout(() => {
          try { newWin.print(); } catch { /* ignore */ }
        }, 800);
      }
    };

    setTimeout(tryPrint, 200);
  }

  getSeverity(status?: string) {
    switch ((status || '').toLowerCase()) {
      case 'open':
        return 'info';
      case 'pending':
        return 'warn';
      case 'shipped':
        return 'success';
      case 'cancelled':
        return 'danger';
      default:
        return 'info';
    }
  }
}

