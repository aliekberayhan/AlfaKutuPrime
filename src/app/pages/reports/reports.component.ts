import { Component, OnInit, AfterViewInit, ElementRef, ViewChild, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { ChartModule } from 'primeng/chart';
import { MultiSelectModule } from 'primeng/multiselect';
import { ToolbarModule } from 'primeng/toolbar';
import { OrdersService, Order } from '../service/orders.service';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, FormsModule, TableModule, ButtonModule, ChartModule, MultiSelectModule, ToolbarModule],
  templateUrl: './reports.component.html',
})
export class ReportsComponent implements OnInit {
  orders: Order[] = [];
  filteredOrders: Order[] = [];
  customers: any[] = [];
  products: any[] = [];
  filterCustomers: string[] = [];
  filterProducts: string[] = [];
  filterStatus: string | null = 'Shipped';
  periods = [{ label: '12 months', value: 12 }, { label: '24 months', value: 24 }, { label: '60 months', value: 60 }];
  filterPeriod = 12;

  
  // simple SVG chart state
  chartLabels: string[] = [];
  chartCounts: number[] = [];
  chartWidth = 900;
  chartHeight = 260;
  barWidth = 40;
  chartMax = 1;
  @ViewChild('chartContainer', { static: true }) chartContainer!: ElementRef;
  // primeNG chart data/options for stacked bar
  chartData: any = { labels: [], datasets: [] };
  chartOptions: any = {};

  constructor(private svc: OrdersService) {}

  ngOnInit(): void {
    this.orders = this.svc.getAll();
    this.customers = Array.from(new Set(this.orders.map(o => o.customer))).map(c => ({ label: c, value: c }));
    const prodSet = new Set<string>();
    this.orders.forEach(o => o.items.forEach(i => prodSet.add(i.product)));
    this.products = Array.from(prodSet).map(p => ({ label: p, value: p }));
    this.applyFilters();
  }

  ngAfterViewInit(): void {
    try {
      const w = this.chartContainer.nativeElement.clientWidth || 900;
      this.chartWidth = Math.max(600, w);
    } catch {
      this.chartWidth = 900;
    }
    // ensure chart recalculation with container width
    this.updateChart();
  }

  applyFilters() {
    const now = new Date();
    const months = this.filterPeriod || 12;
    const cutoff = new Date();
    cutoff.setMonth(now.getMonth() - months);

    this.filteredOrders = this.orders.filter(o => {
      const d = new Date(o.date);
      if (d < cutoff) return false;
      if (this.filterCustomers && this.filterCustomers.length > 0 && !this.filterCustomers.includes(o.customer)) return false;
      if (this.filterStatus && this.filterStatus !== '' && o.status !== this.filterStatus) return false;
      if (this.filterProducts && this.filterProducts.length > 0) {
        if (!o.items.some(it => this.filterProducts.includes(it.product))) return false;
      }
      return true;
    }).sort((a,b) => +new Date(b.date) - +new Date(a.date));

    this.updateChart();
  }

  updateChart() {
    // build month labels for the selected period (short labels)
    const months = this.filterPeriod || 12;
    const labels: string[] = [];
    const counts: number[] = [];
    const now = new Date();
    for (let i = months - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      // MM/YY format e.g., "03/25"
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const yy = String(d.getFullYear()).slice(-2);
      labels.push(`${mm}/${yy}`);
      counts.push(0);
    }

    this.filteredOrders.forEach(o => {
      const dt = new Date(o.date);
      const monthsDiff = (now.getFullYear() - dt.getFullYear()) * 12 + (now.getMonth() - dt.getMonth());
      if (monthsDiff >= 0 && monthsDiff < months) {
        const idx = months - 1 - monthsDiff;
        counts[idx] = (counts[idx] || 0) + 1;
      }
    });

    // prepare stacked datasets by product (sum qty per month)
    const prodList = this.products.map(p => p.value as string);
    // limit to top 8 products by total qty for readability
    const prodTotals: { [k: string]: number } = {};
    for (const o of this.filteredOrders) {
      for (const it of o.items) {
        prodTotals[it.product] = (prodTotals[it.product] || 0) + it.qty;
      }
    }
    const productsSorted = Object.keys(prodTotals).sort((a, b) => prodTotals[b] - prodTotals[a]);
    let selectedProducts: string[] = productsSorted.length ? productsSorted.slice(0, 8) : prodList.slice(0, 8);
    // If specific product filters are applied, only include those products in the chart
    if (this.filterProducts && this.filterProducts.length > 0) {
      selectedProducts = this.filterProducts.filter(p => selectedProducts.includes(p) || prodList.includes(p));
    }

    const datasets: any[] = [];
    const colors = ['#06b6d4', '#6b7280', '#f97316', '#7c3aed', '#16a34a', '#ef4444', '#0ea5a4', '#f59e0b'];
    selectedProducts.forEach((prod, pi) => {
      const dataArr = new Array(labels.length).fill(0);
      this.filteredOrders.forEach(o => {
        const dt = new Date(o.date);
        const monthsDiff = (now.getFullYear() - dt.getFullYear()) * 12 + (now.getMonth() - dt.getMonth());
        if (monthsDiff >= 0 && monthsDiff < months) {
          const idx = months - 1 - monthsDiff;
          const qtySum = o.items.filter(it => it.product === prod).reduce((s, it) => s + it.qty, 0);
          dataArr[idx] += qtySum;
        }
      });
      datasets.push({
        type: 'bar',
        label: prod,
        backgroundColor: colors[pi % colors.length],
        data: dataArr
      });
    });

    this.chartData = { labels, datasets };
    this.chartOptions = {
      maintainAspectRatio: false,
      aspectRatio: 0.8,
      plugins: {
        tooltip: { mode: 'index', intersect: false },
        legend: { labels: { color: '#374151' } }
      },
      scales: {
        x: { stacked: true, ticks: { color: '#6b7280' }, grid: { drawBorder: false } },
        y: { stacked: true, ticks: { color: '#6b7280' }, grid: { drawBorder: false } }
      }
    };
    // update legacy SVG bindings (kept) and responsive bar width
    this.chartLabels = labels;
    this.chartCounts = counts;
    this.chartMax = Math.max(1, ...counts);
    const available = Math.max(300, this.chartWidth - 80);
    this.barWidth = Math.max(24, Math.floor(available / Math.max(1, counts.length)));
  }

  calcTotal(o: Order) {
    return o.items.reduce((s, i) => s + i.qty * i.price, 0);
  }
  exportCsv() {
    if (!this.filteredOrders || this.filteredOrders.length === 0) return;
    const rows: string[] = [];
    const header = ['Order','Customer','Date','Status','Total','Items'];
    rows.push(header.map(h => `"${h}"`).join(','));
    for (const o of this.filteredOrders) {
      const items = o.items.map(it => `${it.product} x${it.qty}`).join(' | ');
      const date = new Date(o.date).toLocaleString();
      const total = this.calcTotal(o).toFixed(2);
      const vals = [o.id, o.customer, date, o.status, total, items];
      rows.push(vals.map(v => `"${String(v).replace(/"/g,'""')}"`).join(','));
    }
    const csv = rows.join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `orders_report_${new Date().toISOString().slice(0,10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  exportXls() {
    if (!this.filteredOrders || this.filteredOrders.length === 0) return;
    // Build a simple HTML table and save as .xls (Excel can open it)
    let html = '<table><thead><tr><th>Order</th><th>Customer</th><th>Date</th><th>Status</th><th>Total</th><th>Items</th></tr></thead><tbody>';
    for (const o of this.filteredOrders) {
      const items = o.items.map(it => `${it.product} x${it.qty}`).join(' | ');
      const date = new Date(o.date).toLocaleString();
      const total = this.calcTotal(o).toFixed(2);
      html += `<tr><td>${o.id}</td><td>${o.customer}</td><td>${date}</td><td>${o.status}</td><td>${total}</td><td>${items}</td></tr>`;
    }
    html += '</tbody></table>';
    const blob = new Blob([html], { type: 'application/vnd.ms-excel' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `orders_report_${new Date().toISOString().slice(0,10)}.xls`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }
}

