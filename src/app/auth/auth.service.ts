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
  private users$ = new BehaviorSubject<StaticUser[]>([]);

  constructor() {
    // try restore from storage
    const raw = localStorage.getItem('current_user');
    if (raw) {
      try {
        this.currentUser$.next(JSON.parse(raw));
      } catch {}
    }
    // load users from storage or defaults
    const usersRaw = localStorage.getItem('users_v1');
    if (usersRaw) {
      try {
        this.users$.next(JSON.parse(usersRaw) as StaticUser[]);
      } catch {
        this.users$.next(USERS as StaticUser[]);
      }
    } else {
      this.users$.next(USERS as StaticUser[]);
    }
  }

  login(userName: string, password: string): Observable<CurrentUser> {
    const found = this.users$.getValue().find(u => u.userName === userName && u.password === password);
    if (!found) return throwError(() => new Error('Invalid credentials'));
    if ((found as any).active === false) return throwError(() => new Error('Account inactive'));
    const user: CurrentUser = { userName: found.userName, roles: found.roles };
    this.currentUser$.next(user);
    localStorage.setItem('current_user', JSON.stringify(user));
    return of(user);
  }

  // users management
  getUsers(): Observable<StaticUser[]> {
    return this.users$.asObservable();
  }

  getUsersSnapshot(): StaticUser[] {
    return this.users$.getValue();
  }

  addUser(u: StaticUser) {
    const list = [...this.users$.getValue(), u];
    this.users$.next(list);
    localStorage.setItem('users_v1', JSON.stringify(list));
  }

  updateUser(u: StaticUser) {
    const list = this.users$.getValue().map(x => x.userName === u.userName ? u : x);
    this.users$.next(list);
    localStorage.setItem('users_v1', JSON.stringify(list));
  }

  deleteUser(userName: string) {
    const list = this.users$.getValue().filter(x => x.userName !== userName);
    this.users$.next(list);
    localStorage.setItem('users_v1', JSON.stringify(list));
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

