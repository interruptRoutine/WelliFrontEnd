import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';

// 1. IMPORTA IL PROVIDER NECESSARIO
import { provideNativeDateAdapter } from '@angular/material/core';

import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [

    provideRouter(routes),
    provideAnimations(),
    provideHttpClient(
      withInterceptors([authInterceptor])
    ),

    // 2. AGGIUNGI QUESTO PROVIDER
    // Questo dice ad Angular Material di usare
    // l'oggetto Date nativo per tutti i datepicker.
    provideNativeDateAdapter()

  ]
};
