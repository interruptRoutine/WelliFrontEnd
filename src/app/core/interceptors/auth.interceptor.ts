import { inject } from '@angular/core';
import { HttpInterceptorFn, HttpRequest, HttpHandlerFn } from '@angular/common/http';
import { AuthService } from '../auth/auth.service';

export const authInterceptor: HttpInterceptorFn = (req: HttpRequest<any>, next: HttpHandlerFn) => {
  const token = inject(AuthService).getToken();
  // Aggiungi il token SOLO se la richiesta è per la nostra API
  // e se il token esiste.
  if (token && req.url.startsWith('/api')) {

    const authReq = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` }
    });
    return next(authReq);
  }

  // Per tutte le altre richieste, inoltra l'originale
  return next(req);
};
