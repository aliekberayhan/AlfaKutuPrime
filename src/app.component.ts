import { Component, OnInit, inject } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from './app/auth/auth.service';

@Component({
    selector: 'app-root',
    standalone: true,
    imports: [RouterModule],
    template: `<router-outlet></router-outlet>`
})
export class AppComponent implements OnInit {
    private router = inject(Router);
    private auth: any = inject(AuthService);

    ngOnInit() {
        try {
            const path = window.location.pathname || '/';
            const user = this.auth.getCurrentUserSync();
            // Only redirect anonymous users visiting root to landing
            if ((path === '/' || path === '') && !user) {
                this.router.navigateByUrl('/landing');
            }
        } catch (e) {
            // no-op in non-browser environments
        }
    }
}
