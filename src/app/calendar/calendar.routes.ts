import { Routes } from '@angular/router';
import { CalendarViewComponent } from './calendar-view/calendar-view.component';

export const CALENDAR_ROUTES: Routes = [
  {
    path: '', // La rotta /calendar carica questo componente
    component: CalendarViewComponent
  }
];
