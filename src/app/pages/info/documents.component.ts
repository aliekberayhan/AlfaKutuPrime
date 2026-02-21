import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-documents',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="max-w-5xl mx-auto px-6 md:px-12 lg:px-20 py-8">
      <div class="bg-white rounded-lg shadow-sm p-8">
        <h1 class="text-3xl font-bold mb-4">Documents & Downloads</h1>
        <p class="text-surface-700 mb-4">Important company documents and certificates.</p>

        <div class="space-y-4">
          <div class="flex items-center justify-between p-4 border rounded">
            <div>
              <div class="font-semibold">Company Catalog (PDF)</div>
              <div class="text-sm text-surface-600">Product ranges and specifications</div>
            </div>
            <a class="p-button p-button-sm p-button-outlined" href="https://www.alfakutu.com/wp-content/uploads/2020/01/Antet-06.01.2020-1.png" target="_blank">Download</a>
          </div>
          <div class="flex items-center justify-between p-4 border rounded">
            <div>
              <div class="font-semibold">IATF Certificate</div>
              <div class="text-sm text-surface-600">Quality management certificate</div>
            </div>
            <a class="p-button p-button-sm p-button-outlined" href="#" target="_blank">Download</a>
          </div>
        </div>
      </div>
    </div>
  `
})
export class DocumentsComponent {}

