import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface Product {
    id: string;
    name: string;
    code: string;
    sizes: string[];
}

export interface CustomerOrderItem {
    product: Product;
    size: string;
    quantity: number;
    documents?: File[];
}

export interface CustomerOrder {
    id: string;
    customerUser: string;
    createdAt: string;
    status: 'Pending' | 'Approved' | 'Rejected' | 'Shipped';
    approvedAt?: string;
    approvedBy?: string;
    shippedAt?: string;
    shippedBy?: string;
    items: CustomerOrderItem[];
    notes?: string;
}

const STORAGE_KEY = 'customer_orders_v1';

export const PRODUCTS: Product[] = [
    { id: 'prod-1', name: 'Akü Kapağı - Z Kutup 40x60mm', code: 'AK-Z40', sizes: ['30x50mm', '40x60mm', '50x70mm', '60x80mm'] },
    { id: 'prod-2', name: 'Akü Kapağı - Z Kutup 50x70mm', code: 'AK-Z50', sizes: ['40x60mm', '50x70mm', '60x80mm', '70x90mm'] },
    { id: 'prod-3', name: 'Akü Kapağı - Başlı Model', code: 'AK-BAS', sizes: ['25x40mm', '35x55mm', '45x65mm', '55x75mm', '65x85mm'] },
    { id: 'prod-4', name: 'Akü Kapağı - Standart', code: 'AK-STD', sizes: ['20x35mm', '30x50mm', '40x60mm', '50x70mm'] },
    { id: 'prod-5', name: 'Akü Kapağı - Premium', code: 'AK-PREM', sizes: ['45x65mm', '55x75mm', '65x85mm', '75x95mm'] }
];

@Injectable({ providedIn: 'root' })
export class CustomerOrderService {
    private ordersSubject = new BehaviorSubject<CustomerOrder[]>(this.loadOrders());

    constructor() { }

    private loadOrders(): CustomerOrder[] {
        try {
            return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') as CustomerOrder[];
        } catch {
            return [];
        }
    }

    private saveOrders(orders: CustomerOrder[]) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
        this.ordersSubject.next([...orders]);
    }

    getAll() {
        return this.ordersSubject.asObservable();
    }

    getSnapshot() {
        return this.ordersSubject.getValue();
    }

    getProducts() {
        return PRODUCTS;
    }

    create(order: Omit<CustomerOrder, 'id' | 'createdAt' | 'status' | 'approvedAt' | 'approvedBy'>): CustomerOrder {
        const orders = this.getSnapshot();
        const newOrder: CustomerOrder = {
            id: 'ORD-' + Date.now(),
            customerUser: order.customerUser,
            createdAt: new Date().toISOString(),
            status: 'Pending',
            items: order.items,
            notes: order.notes
        };
        orders.push(newOrder);
        this.saveOrders(orders);
        return newOrder;
    }

    approve(orderId: string, approvedBy: string): CustomerOrder | null {
        const orders = this.getSnapshot();
        const order = orders.find(o => o.id === orderId);
        if (order) {
            order.status = 'Approved';
            order.approvedAt = new Date().toISOString();
            order.approvedBy = approvedBy;
            this.saveOrders(orders);
        }
        return order || null;
    }

    reject(orderId: string): CustomerOrder | null {
        const orders = this.getSnapshot();
        const order = orders.find(o => o.id === orderId);
        if (order) {
            order.status = 'Rejected';
            this.saveOrders(orders);
        }
        return order || null;
    }

    ship(orderId: string, shippedBy: string): CustomerOrder | null {
        const orders = this.getSnapshot();
        const order = orders.find(o => o.id === orderId);
        if (order) {
            order.status = 'Shipped';
            order.shippedAt = new Date().toISOString();
            order.shippedBy = shippedBy;
            this.saveOrders(orders);
        }
        return order || null;
    }

    /**
     * Deletes an order by id. Returns the removed order or null if not found.
     */
    delete(orderId: string): CustomerOrder | null {
        const orders = this.getSnapshot();
        const idx = orders.findIndex(o => o.id === orderId);
        if (idx === -1) {
            return null;
        }
        const [removed] = orders.splice(idx, 1);
        this.saveOrders(orders);
        return removed;
    }
}
