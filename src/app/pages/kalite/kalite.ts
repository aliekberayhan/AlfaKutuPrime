import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-kalite',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="p-4">
      <h2>Kalite Sayfası</h2>
      <p>Bu sayfa Kalite rolüne sahip kullanıcılar için gösterilecektir.</p>
    </div>
  `
})
export class KalitePage {}

