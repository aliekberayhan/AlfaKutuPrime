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
  template: `
    <section class="w-full">
      <div class="bg-surface-50">
        <div class="max-w-7xl mx-auto px-6 md:px-12 lg:px-20 py-12">
          <div class="grid grid-cols-12 gap-8 items-start">
            <div class="col-span-12 lg:col-span-8">
              <h1 class="text-4xl md:text-5xl font-extrabold mb-4 text-surface-900">About Alfa Kutu</h1>
              <p class="text-lg text-surface-700 leading-relaxed max-w-3xl mb-6">
                AlfaKutu is specialized in production of plastic components for the lead-acid battery industry since the 1970s.
                We manufacture battery boxes, lids and accessories with certified processes and modern facilities.
              </p>

              <!-- Integrated feature tiles aligned with landing style (updated icons + animations) -->
              <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
                <div class="p-4 bg-white rounded-md border shadow-sm flex gap-4 items-start">
                  <div class="icon-bg icon-lg float" style="background: linear-gradient(135deg,#FEF3C7,#E0F2FE)">
                    <!-- Industry SVG -->
                    <svg class="svg-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                      <path d="M3 13h4v6H3zM9 9h4v10H9zM15 5h4v14h-4z" stroke="#B45309" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" />
                      <path d="M2 3h20" stroke="#B45309" stroke-width="1.2" stroke-linecap="round"/>
                    </svg>
                  </div>
                  <div>
                    <div class="font-semibold">Industry 4.0 Production</div>
                    <div class="text-sm text-surface-600">Automated lines for consistent quality and throughput.</div>
                  </div>
                </div>

                <div class="p-4 bg-white rounded-md border shadow-sm flex gap-4 items-start">
                  <div class="icon-bg icon-lg float" style="background: linear-gradient(135deg,#ECFEFF,#FEF3C7)">
                    <!-- Design SVG -->
                    <svg class="svg-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                      <path d="M4 20h16" stroke="#0EA5A4" stroke-width="1.2" stroke-linecap="round"/>
                      <path d="M6 4l6 6" stroke="#0EA5A4" stroke-width="1.2" stroke-linecap="round"/>
                      <path d="M14 4l4 4" stroke="#0EA5A4" stroke-width="1.2" stroke-linecap="round"/>
                    </svg>
                  </div>
                  <div>
                    <div class="font-semibold">Design & Prototyping</div>
                    <div class="text-sm text-surface-600">Rapid prototyping and tooling for OEM requirements.</div>
                  </div>
                </div>

                <div class="p-4 bg-white rounded-md border shadow-sm flex gap-4 items-start">
                  <div class="icon-bg icon-lg float" style="background: linear-gradient(135deg,#F0F9FF,#FCE7F3)">
                    <!-- Quality SVG -->
                    <svg class="svg-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                      <path d="M12 2l3 6 6 3-6 3-3 6-3-6-6-3 6-3 3-6z" stroke="#3730A3" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                  </div>
                  <div>
                    <div class="font-semibold">Quality Systems</div>
                    <div class="text-sm text-surface-600">IATF / ISO certified processes with full traceability.</div>
                  </div>
                </div>
              </div>

              <div class="mt-8">
                <h3 class="text-2xl font-semibold mb-3">Core Capabilities</h3>
                <ul class="grid grid-cols-1 sm:grid-cols-2 gap-2 list-disc pl-6 text-surface-700">
                  <li>High-volume production with Industry 4.0 automation</li>
                  <li>Design & prototyping for OEM and aftermarket</li>
                  <li>Quality systems and full traceability</li>
                  <li>Global logistics and responsive customer support</li>
                </ul>
              </div>
            </div>

            <aside class="col-span-12 lg:col-span-4">
              <div class="sticky top-24 p-6 rounded-md bg-white border shadow-sm">
                <div class="text-sm text-surface-600">Contact</div>
                <div class="font-medium mt-2">ALFA KUTU VE PLASTİK SAN. TİC. LTD. ŞTİ.</div>
                <div class="text-surface-600 mt-2 text-sm">Çorlu 1 OSB Türkgücü Mah. Yılmaz Alpaslan Cd. No:40, Çorlu/Tekirdağ</div>
                <div class="mt-4">
                  <div class="text-sm text-surface-600">Phone</div>
                  <div class="font-medium">+90 282 000 0000</div>
                </div>
                <div class="mt-4">
                  <div class="text-sm text-surface-600">Email</div>
                  <div class="font-medium"><a class="text-primary-600" href="mailto:info@alfakutu.com">info@alfakutu.com</a></div>
                </div>
              </div>

              <div class="mt-6 p-6 rounded-md bg-white border shadow-sm">
                <div class="text-sm text-surface-600">Certifications</div>
                <ul class="list-disc pl-6 mt-2 text-surface-700">
                  <li>IATF 16949</li>
                  <li>ISO 9001</li>
                  <li>ISO 14001</li>
                </ul>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </section>
  `
})
export class AboutComponent {}

