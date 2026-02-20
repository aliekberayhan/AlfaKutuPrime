import { Injectable } from '@angular/core';
import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

@Injectable()
export class TokenInterceptor implements HttpInterceptor {
  constructor(private auth: AuthService) {}
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Static auth doesn't use JWT; but we can attach current username for backend debug if present
    const user = this.auth.getCurrentUserSync?.();
    if (user && user.userName) {
      const cloned = req.clone({
        setHeaders: {
          'X-User': user.userName
        }
      });
      return next.handle(cloned);
    }
    return next.handle(req);
  }
}

