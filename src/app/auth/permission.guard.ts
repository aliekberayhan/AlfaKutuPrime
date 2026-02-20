import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, Router } from '@angular/router';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class PermissionGuard implements CanActivate {
  constructor(private auth: AuthService, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot): boolean {
    const perm = route.data?.['permission'] as string | undefined;
    if (!perm) return true;
    // if not logged in, redirect to login
    if (!this.auth.isLoggedIn()) {
      this.router.navigate(['/auth/login']);
      return false;
    }
    if (this.auth.hasPermission(perm)) return true;
    // redirect to access denied
    this.router.navigate(['/auth/access']);
    return false;
  }
}

