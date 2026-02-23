import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [CommonModule, ButtonModule, RippleModule],
  styles: [`
    .icon-bg { width:3.5rem;height:3.5rem;border-radius:0.75rem;display:flex;align-items:center;justify-content:center; }
    .icon-lg { width:4rem;height:4rem; }
    .svg-icon { width:1.6rem;height:1.6rem; }
    .float { animation: float 4s ease-in-out infinite; }
    @keyframes float {
      0% { transform: translateY(0px); }
      50% { transform: translateY(-6px); }
      100% { transform: translateY(0px); }
    }
  `],
  templateUrl: './about.component.html'
})
export class AboutComponent {}

