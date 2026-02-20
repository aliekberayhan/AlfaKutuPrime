import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-customer',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="p-4">
      <h2>Müşteri Sayfası</h2>
      <p>Bu sayfa Customer rolüne sahip kullanıcılar için gösterilecektir.</p>
    </div>
  `
})
export class CustomerPage {}

