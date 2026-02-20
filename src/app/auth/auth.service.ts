import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { USERS, ROLES, StaticUser, StaticRole } from './static-auth.data';

export interface CurrentUser {
  userName: string;
  roles: string[];
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private currentUser$ = new BehaviorSubject<CurrentUser | null>(null);
  private rolesChanged$ = new BehaviorSubject<number>(0);

  constructor() {
    // try restore from storage
    const raw = localStorage.getItem('current_user');
    if (raw) {
      try {
        this.currentUser$.next(JSON.parse(raw));
      } catch {}
    }
  }

  login(userName: string, password: string): Observable<CurrentUser> {
    const found = USERS.find(u => u.userName === userName && u.password === password);
    if (!found) return throwError(() => new Error('Invalid credentials'));
    const user: CurrentUser = { userName: found.userName, roles: found.roles };
    this.currentUser$.next(user);
    localStorage.setItem('current_user', JSON.stringify(user));
    return of(user);
  }

  logout() {
    this.currentUser$.next(null);
    localStorage.removeItem('current_user');
  }

  getCurrentUser(): Observable<CurrentUser | null> {
    return this.currentUser$.asObservable();
  }

  getCurrentUserSync(): CurrentUser | null {
    return this.currentUser$.getValue();
  }

  isLoggedIn(): boolean {
    return !!this.getCurrentUserSync();
  }

  // replace current user (useful when admin edits current user's roles)
  setCurrentUser(user: CurrentUser | null) {
    this.currentUser$.next(user);
    if (user) {
      localStorage.setItem('current_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('current_user');
    }
  }

  // notify that role definitions changed (permissions updated)
  notifyRolesChanged() {
    this.rolesChanged$.next(Date.now());
  }

  getRolesChanged(): Observable<number> {
    return this.rolesChanged$.asObservable();
  }

  getRolesForUser(user?: CurrentUser): string[] {
    const u = user ?? this.getCurrentUserSync();
    return u?.roles ?? [];
  }

  hasPermission(permission: string): boolean {
    const roles = this.getRolesForUser();
    if (!roles.length) return false;
    // find role objects
    const roleObjs: StaticRole[] = ROLES.filter(r => roles.includes(r.name));
    return roleObjs.some(r => r.permissions.includes(permission));
  }
}

