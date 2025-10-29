import { Routes } from '@angular/router';
import { MoodComponent } from './mood/mood.component';

export const routes: Routes = [
  { path: 'mood', component: MoodComponent },
  { path: '', pathMatch: 'full', redirectTo: 'mood' },
  {
    path: 'calendar',
    // Carica pigramente le rotte del calendario
    loadChildren: () => import('./calendar/calendar.routes')
      .then(r => r.CALENDAR_ROUTES)
    // Aggiungi qui una guardia (es. canActivate: [authGuard]) se l'hai
  },

  // Redirezione di default
  { path: '', redirectTo: '/calendar', pathMatch: 'full' }
];
