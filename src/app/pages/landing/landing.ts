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
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '@/app/auth/auth.service';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-landing',
    standalone: true,
    imports: [CommonModule, RouterModule, TopbarWidget, HeroWidget, HighlightsWidget, PricingWidget, FooterWidget, RippleModule, StyleClassModule, ButtonModule, DividerModule],
    templateUrl: './landing.component.html'
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

    auth = inject(AuthService);
    constructor(private router: Router) {}

    ngOnInit(): void {
        // If user already logged in, redirect into the app pages (dashboard)
        if (this.auth.isLoggedIn()) {
            this.router.navigate(['/pages']);
            return;
        }

        // also react to login events while on landing page
        const userSub = this.auth.getCurrentUser().subscribe(u => {
            if (u) {
                this.router.navigate(['/pages']);
            }
        });

        this.sub = this.route.queryParamMap.subscribe(map => {
            this.panel = map.get('panel');
        });

        // ensure we clean up the user subscription together with route subscription
        const originalUnsub = this.sub?.unsubscribe.bind(this.sub);
        const combinedUnsub = () => {
            userSub.unsubscribe();
            originalUnsub && originalUnsub();
        };
        // replace ngOnDestroy cleanup to use combinedUnsub via storing in sub (reuse)
        this.sub = { unsubscribe: combinedUnsub } as unknown as Subscription;
    }

    ngOnDestroy(): void {
        this.sub?.unsubscribe();
    }
}
