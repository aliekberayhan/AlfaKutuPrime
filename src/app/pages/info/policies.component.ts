import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-policies',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="max-w-5xl mx-auto px-6 md:px-12 lg:px-20 py-8">
      <div class="bg-white rounded-lg shadow-sm p-8">
        <h1 class="text-3xl font-bold mb-4">Policies & Compliance</h1>
        <p class="text-surface-700 mb-4">
          Our policies describe how we operate, handle data and ensure quality and safety across our operations. For full documents visit the Documents page.
        </p>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="p-4 border rounded">
            <h3 class="font-semibold mb-2">Privacy Policy</h3>
            <p class="text-sm text-surface-700">We handle personal data with care and comply with applicable regulations.</p>
          </div>
          <div class="p-4 border rounded">
            <h3 class="font-semibold mb-2">Quality & Safety</h3>
            <p class="text-sm text-surface-700">We maintain certified quality processes across manufacturing and testing.</p>
          </div>
        </div>
      </div>
    </div>
  `
})
export class PoliciesComponent {}

