import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MoodService } from './mood.service';
import { MoodResponseDTO } from './mood.types';

@Component({
  selector: 'app-mood',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './mood.component.html',
  styleUrls: ['./mood.component.css']
})
export class MoodComponent {
  private fb = inject(FormBuilder);
  private svc = inject(MoodService);

  loading = false;
  error: string | null = null;
  result: MoodResponseDTO | null = null;

  form = this.fb.group({
    moodText: ['', [Validators.required, Validators.maxLength(500)]]
  });

  submit(): void {
    this.error = null; this.result = null;
    if (this.form.invalid) return;
    this.loading = true;
    this.svc.setMood({ moodText: this.form.value.moodText! }).subscribe({
      next: res => { this.result = res; this.loading = false; },
      error: err => { this.error = err?.error?.message || 'Errore'; this.loading = false; }
    });
  }

  loadToday(): void {
    this.error = null; this.result = null; this.loading = true;
    this.svc.getToday().subscribe({
      next: res => { this.result = res; this.loading = false; },
      error: err => {
        this.error = err?.status === 204 ? 'Nessun mood per oggi' : (err?.error?.message || 'Errore');
        this.loading = false;
      }
    });
  }
}
