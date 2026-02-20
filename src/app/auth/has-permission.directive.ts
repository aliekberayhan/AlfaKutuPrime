import { Directive, Input, TemplateRef, ViewContainerRef } from '@angular/core';
import { AuthService } from './auth.service';

@Directive({
  selector: '[hasPermission]'
})
export class HasPermissionDirective {
  private permission?: string;
  constructor(private tpl: TemplateRef<any>, private vc: ViewContainerRef, private auth: AuthService) {}

  @Input()
  set hasPermission(value: string) {
    this.permission = value;
    this.update();
  }

  private update() {
    if (!this.permission) {
      this.vc.clear();
      return;
    }
    const ok = this.auth.hasPermission(this.permission);
    this.vc.clear();
    if (ok) {
      this.vc.createEmbeddedView(this.tpl);
    }
  }
}

