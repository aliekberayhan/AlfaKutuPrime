import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { RippleModule } from 'primeng/ripple';
import { StyleClassModule } from 'primeng/styleclass';
import { ButtonModule } from 'primeng/button';
import { DividerModule } from 'primeng/divider';
import { TopbarWidget } from './components/topbarwidget.component';
import { HeroWidget } from './components/herowidget';
// FeaturesWidget will be loaded dynamically to avoid static import resolution issues
import { HighlightsWidget } from './components/highlightswidget';
import { PricingWidget } from './components/pricingwidget';
import { FooterWidget } from './components/footerwidget';
// dynamic components will be loaded via import() and rendered with ngComponentOutlet
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-landing',
    standalone: true,
    imports: [CommonModule, RouterModule, TopbarWidget, HeroWidget, HighlightsWidget, PricingWidget, FooterWidget, RippleModule, StyleClassModule, ButtonModule, DividerModule],
    template: `
        <div class="bg-surface-0 dark:bg-surface-900">
            <div id="home" class="landing-wrapper overflow-hidden">
                <topbar-widget class="py-6 px-6 mx-0 md:mx-12 lg:mx-20 lg:px-20 flex items-center justify-between relative lg:static" />

                <ng-container *ngIf="panel !== 'about' && panel !== 'policies' && panel !== 'documents'">
                    <hero-widget />
                    <div class="px-6 md:px-12 lg:px-20">
                        <ng-container *ngComponentOutlet="featuresComponent | async"></ng-container>
                    </div>
                    <highlights-widget />
                    <pricing-widget />
                </ng-container>

                <ng-container *ngIf="panel === 'about'">
                    <div class="px-6 md:px-12 lg:px-20 py-8">
                        <ng-container *ngComponentOutlet="aboutComponent | async"></ng-container>
                    </div>
                </ng-container>

                <ng-container *ngIf="panel === 'policies'">
                    <div class="px-6 md:px-12 lg:px-20 py-8">
                        <ng-container *ngComponentOutlet="policiesComponent | async"></ng-container>
                    </div>
                </ng-container>

                <ng-container *ngIf="panel === 'documents'">
                    <div class="px-6 md:px-12 lg:px-20 py-8">
                        <ng-container *ngComponentOutlet="documentsComponent | async"></ng-container>
                    </div>
                </ng-container>

                <footer-widget />
            </div>
        </div>
    `
})
export class Landing implements OnInit, OnDestroy {
    private route = inject(ActivatedRoute);
    private sub?: Subscription;
    panel: string | null = null;
    // references for dynamic outlet
    aboutComponent = import('../info/about.component').then(m => m.AboutComponent);
    policiesComponent = import('../info/policies.component').then(m => m.PoliciesComponent);
    documentsComponent = import('../info/documents.component').then(m => m.DocumentsComponent);
    featuresComponent = import('./components/featureswidget').then(m => m.FeaturesWidget);

    ngOnInit(): void {
        this.sub = this.route.queryParamMap.subscribe(map => {
            this.panel = map.get('panel');
        });
    }

    ngOnDestroy(): void {
        this.sub?.unsubscribe();
    }
}
