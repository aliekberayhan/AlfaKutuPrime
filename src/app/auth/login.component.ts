import { Component } from '@angular/core';
import { AuthService } from './auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  template: `
    <div class="p-fluid">
      <label>Username</label>
      <input pInputText #u />
      <label>Password</label>
      <input pInputText type="password" #p />
      <p-button label="Login" (onClick)="login(u.value, p.value)"></p-button>
    </div>
  `
})
export class LoginComponent {
  constructor(private auth: AuthService, private router: Router) {}
  login(user: string, pass: string) {
    this.auth.login(user, pass).subscribe({
      next: _res => {
        // AuthService.login already sets current user and localStorage.
        // Navigate to app root (dashboard) on success.
        this.router.navigate(['/']);
      },
      error: err => alert('Login failed')
    });
  }
}

