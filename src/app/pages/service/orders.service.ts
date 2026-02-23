import { Injectable } from '@angular/core';

export type OrderStatus = 'Open' | 'Pending' | 'Shipped' | 'Cancelled';

export interface OrderItem {
  product: string;
  qty: number;
  price: number;
}

export interface Order {
  id: string;
  customer: string;
  date: string;
  status: OrderStatus;
  items: OrderItem[];
  note?: string;
}

const STORAGE_KEY = 'demo_orders_v1';

@Injectable({ providedIn: 'root' })
export class OrdersService {
  constructor() {
    // ensure initial mock data exists (generate richer demo data)
    const existing = (() => {
      try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') as Order[]; } catch { return []; }
    })();
    if (!localStorage.getItem(STORAGE_KEY) || existing.length < 200) {
      const products = [
        { id: 'Battery Box A', price: 2.5 },
        { id: 'Lid B', price: 0.8 },
        { id: 'Battery Box C', price: 3.0 },
        { id: 'Cover D', price: 1.2 },
        { id: 'Terminal E', price: 0.5 },
        { id: 'Clamp F', price: 0.9 },
        { id: 'Seal G', price: 1.5 },
        { id: 'Insert H', price: 2.2 },
        { id: 'Plate I', price: 1.8 },
        { id: 'Socket J', price: 0.65 }
      ];
      const customers = ['customer1', 'customer2', 'customer3', 'customer4', 'customer5', 'customer6', 'customer7', 'customer8'];
      const statuses: OrderStatus[] = ['Open', 'Pending', 'Shipped', 'Cancelled'];

      const demo: Order[] = [];
      const TOTAL = 300;
      // generate demo orders spanning up to ~60 months in the past with slight recent bias
      for (let i = 0; i < TOTAL; i++) {
        // bias towards recent months (square of random gives more weight to smaller numbers)
        const monthsAgo = Math.floor(Math.random() * Math.random() * 60);
        const dt = new Date();
        dt.setMonth(dt.getMonth() - monthsAgo);
        dt.setDate(1 + Math.floor(Math.random() * 28));

        const itemCount = 1 + Math.floor(Math.random() * 4); // 1..4 items
        const items: OrderItem[] = [];
        for (let j = 0; j < itemCount; j++) {
          const p = products[Math.floor(Math.random() * products.length)];
          const qty = Math.floor(Math.random() * 500) + 1;
          // small price variation
          const price = Math.round((p.price * (0.9 + Math.random() * 0.3)) * 100) / 100;
          items.push({ product: p.id, qty, price });
        }

        const id = 'ORD-' + (1000 + i).toString();
        demo.push({
          id,
          customer: customers[Math.floor(Math.random() * customers.length)],
          date: dt.toISOString(),
          status: statuses[Math.floor(Math.random() * statuses.length)],
          items
        });
      }

      // add a few recent, predictable orders for testing
      demo.unshift({
        id: 'ORD-9001',
        customer: 'customer1',
        date: new Date().toISOString(),
        status: 'Open',
        items: [
          { product: 'Battery Box A', qty: 120, price: 2.5 },
          { product: 'Lid B', qty: 80, price: 0.8 }
        ]
      });
      demo.unshift({
        id: 'ORD-9002',
        customer: 'customer2',
        date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
        status: 'Pending',
        items: [
          { product: 'Battery Box C', qty: 50, price: 3.0 }
        ]
      });

      localStorage.setItem(STORAGE_KEY, JSON.stringify(demo));
    }
  }

  getAll(): Order[] {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') as Order[];
    } catch {
      return [];
    }
  }

  saveAll(list: Order[]) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  }

  updateStatus(id: string, status: OrderStatus) {
    const list = this.getAll().map(o => o.id === id ? { ...o, status } : o);
    this.saveAll(list);
    return list.find(o => o.id === id) ?? null;
  }

  add(order: Omit<Order, 'id' | 'date'>) {
    const id = 'ORD-' + Math.random().toString(36).slice(2,8).toUpperCase();
    const created: Order = { ...order, id, date: new Date().toISOString() };
    const list = [created, ...this.getAll()];
    this.saveAll(list);
    return created;
  }
}

