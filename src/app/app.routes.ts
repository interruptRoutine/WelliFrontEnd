import { Routes } from '@angular/router';
import { MoodComponent } from './mood/mood.component';

export const routes: Routes = [
  { path: 'mood', component: MoodComponent },
  { path: '', pathMatch: 'full', redirectTo: 'mood' }
];
