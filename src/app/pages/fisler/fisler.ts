import { Component, OnInit, signal, ViewChild, computed } from '@angular/core';
import { ConfirmationService, MessageService } from 'primeng/api';
import { Table, TableModule } from 'primeng/table';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';
import { ToastModule } from 'primeng/toast';
import { ToolbarModule } from 'primeng/toolbar';
import { RatingModule } from 'primeng/rating';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';
import { RadioButtonModule } from 'primeng/radiobutton';
import { InputNumberModule } from 'primeng/inputnumber';
import { DialogModule } from 'primeng/dialog';
import { TagModule } from 'primeng/tag';
import { InputIconModule } from 'primeng/inputicon';
import { IconFieldModule } from 'primeng/iconfield';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { Product } from '../service/fis.service';
import { FisService } from '../service/fis.service';

interface Column {
    field: string;
    header: string;
    customExportHeader?: string;
}

interface ExportColumn {
    title: string;
    dataKey: string;
}

type InventoryStatus = 'INSTOCK' | 'LOWSTOCK' | 'OUTOFSTOCK' | 'OK' | 'LOW' | 'ZERO' | 'REJECTED';

@Component({
    selector: 'app-fisler',
    standalone: true,
    imports: [
        CommonModule,
        TableModule,
        FormsModule,
        ButtonModule,
        RippleModule,
        ToastModule,
        ToolbarModule,
        RatingModule,
        InputTextModule,
        TextareaModule,
        SelectModule,
        RadioButtonModule,
        InputNumberModule,
        DialogModule,
        TagModule,
        InputIconModule,
        IconFieldModule,
        ConfirmDialogModule
    ],
    templateUrl: './fisler.html',
    providers: [MessageService, ConfirmationService]
})
export class Fisler implements OnInit {
    
    productDialog = false;

    products = signal<Product[]>([]);
    product: Product = {};
    selectedProducts: Product[] | null = null;
    submitted = false;

    
    loading = signal<boolean>(false);
    error = signal<string | null>(null);

    statuses: { label: string; value: InventoryStatus }[] = [];

    @ViewChild('dt') dt!: Table;

    exportColumns: ExportColumn[] = [];
    cols: Column[] = [];

    totalCount = computed(() => this.products().length);

    constructor(
        private FisService: FisService,
        private messageService: MessageService,
        private confirmationService: ConfirmationService
    ) { }

    ngOnInit(): void {
        this.initUiMeta();
        this.loadData();
    }

    private initUiMeta(): void {
        
        this.statuses = [
            { label: 'INSTOCK', value: 'INSTOCK' },
            { label: 'LOWSTOCK', value: 'LOWSTOCK' },
            { label: 'OUTOFSTOCK', value: 'OUTOFSTOCK' },
            { label: 'OK', value: 'OK' },
            { label: 'LOW', value: 'LOW' },
            { label: 'ZERO', value: 'ZERO' },
            { label: 'REJECTED', value: 'REJECTED' }
        ];

        this.cols = [
            { field: 'id', header: 'Slip No', customExportHeader: 'Slip No' },
            { field: 'karantinaGiris', header: 'Quarantine In' },
            { field: 'karantinaCikis', header: 'Quarantine Out' },
            { field: 'isemriNo', header: 'Work Order No' },
            { field: 'isIstasyonuNo', header: 'Work Station' },
            { field: 'isIstasyonuAdi', header: 'Work Station Name' },
            { field: 'code', header: 'Item Code' },
            { field: 'name', header: 'Item Name' },
            { field: 'ekipmanNo', header: 'Equipment No' },
            { field: 'miktar', header: 'Quantity' },
            { field: 'redMiktar', header: 'Rejected Qty' },
            { field: 'planFisRef', header: 'Plan Slip Ref' },
            { field: 'description', header: 'Description' }
        ];

        this.exportColumns = this.cols.map(col => ({
            title: col.header,
            dataKey: col.field
        }));
    }

    private loadData(): void {
        this.loading.set(true);
        this.error.set(null);

        this.FisService
            .getProducts()
            .then(data => {
                this.products.set(Array.isArray(data) ? data : []);
            })
            .catch(err => {
                this.error.set('Data could not be read. JSON path/format may be incorrect.');
                this.products.set([]);
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Production slips could not be loaded.',
                    life: 4000
                });
            })
            .finally(() => this.loading.set(false));
    }

    exportCSV(): void {
        this.dt.exportCSV();
    }

    onGlobalFilter(table: Table, event: Event): void {
        const value = (event.target as HTMLInputElement).value ?? '';
        table.filterGlobal(value, 'contains');
    }

    getSeverity(status?: string) {
        switch ((status ?? '').toUpperCase()) {
            case 'INSTOCK':
            case 'OK':
                return 'success';
            case 'LOWSTOCK':
            case 'LOW':
                return 'warn';
            case 'OUTOFSTOCK':
            case 'ZERO':
            case 'REJECTED':
                return 'danger';
            default:
                return 'info';
        }
    }

    openNew(): void {
        this.product = {};
        this.submitted = false;
        this.productDialog = true;
    }

    editProduct(product: Product): void {
        this.product = { ...product };
        this.productDialog = true;
    }

    hideDialog(): void {
        this.productDialog = false;
        this.submitted = false;
    }

    deleteSelectedProducts(): void {
        if (!this.selectedProducts?.length) return;

        this.confirmationService.confirm({
            message: 'Delete selected records?',
            header: 'Confirm',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                const selected = new Set(this.selectedProducts!.map(x => x.id));
                this.products.set(this.products().filter(x => !selected.has(x.id)));
                this.selectedProducts = null;

                this.messageService.add({
                    severity: 'success',
                    summary: 'Success',
                    detail: 'Records deleted (local).',
                    life: 2500
                });
            }
        });
    }

    deleteProduct(product: Product): void {
        this.confirmationService.confirm({
            message: `Delete: ${product.name ?? product.id ?? ''}?`,
            header: 'Confirm',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                this.products.set(this.products().filter(x => x.id !== product.id));
                this.product = {};
                this.messageService.add({
                    severity: 'success',
                    summary: 'Success',
                    detail: 'Record deleted (local).',
                    life: 2500
                });
            }
        });
    }

    saveProduct(): void {
        this.submitted = true;

        if (!this.product.name?.trim() && !this.product.id?.trim()) return;

        const list = [...this.products()];
        const idx = this.findIndexById(this.product.id ?? '');

        if (idx >= 0) {
            if (this.product.redMiktar && Number(this.product.redMiktar) > 0) {
                this.product.karantinaCikis = this.product.karantinaCikis || this.nowTimestamp();
            }
            list[idx] = { ...this.product };
            this.products.set(list);
            this.messageService.add({
                severity: 'success',
                summary: 'Success',
                detail: 'Record updated (local).',
                life: 2500
            });
        } else {
            this.product.id = this.product.id?.trim() || this.createId();
            // Karantina giriş: yeni kayıt oluşturulurken karantinaGiris zamanını kaydet (eğer yoksa)
            this.product.karantinaGiris = this.product.karantinaGiris || this.nowTimestamp();
            this.products.set([...list, { ...this.product }]);

            this.messageService.add({
                severity: 'success',
                summary: 'Success',
                detail: 'Record added (local).',
                life: 2500
            });
        }

        this.productDialog = false;
        this.product = {};
    }

    private findIndexById(id: string): number {
        if (!id) return -1;
        const list = this.products();
        for (let i = 0; i < list.length; i++) {
            if (list[i].id === id) return i;
        }
        return -1;
    }

    private createId(): string {
        let id = '';
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        for (let i = 0; i < 8; i++) {
            id += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return id;
    }

    private nowTimestamp(): string {
        return new Date().toISOString();
    }
}
