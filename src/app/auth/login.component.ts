import { Component } from '@angular/core';
import { AuthService } from './auth.service';

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
  constructor(private auth: AuthService) {}
  login(user: string, pass: string) {
    this.auth.login(user, pass).subscribe({
      next: res => {
        this.auth.setToken((res as any).token);
        window.location.reload();
      },
      error: err => alert('Login failed')
    });
  }
}

