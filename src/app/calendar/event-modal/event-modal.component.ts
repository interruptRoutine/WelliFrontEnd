import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule, formatDate } from '@angular/common'; // Importa formatDate
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { EventDataService, EventDto } from '../event-data.service';

// Importa tutti i moduli di Material necessari
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker'; // <-- IMPORTANTE
import { MatNativeDateModule } from '@angular/material/core';      // <-- IMPORTANTE

@Component({
  selector: 'app-event-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCheckboxModule,
    MatSelectModule,
    MatDatepickerModule,   // <-- Aggiunto
    MatNativeDateModule    // <-- Aggiunto
  ],
  templateUrl: './event-modal.component.html',
  styleUrls: ['./event-modal.component.css']
})
export class EventModalComponent implements OnInit {
  eventForm: FormGroup;
  isNew: boolean;
  eventId: string | null;
  isLoading = false;

  timeSlots: string[] = [];

  constructor(
    private fb: FormBuilder,
    private eventService: EventDataService,
    public dialogRef: MatDialogRef<EventModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.isNew = !data.id;
    this.eventId = data.id || null;
    const event = data.eventData || {};

    const startDate = new Date(event.start || new Date());
    const endDate = new Date(event.end || new Date());

    // Popola la lista degli orari (es. ogni 30 min)
    this.generateTimeSlots(30);

    this.eventForm = this.fb.group({
      title: [event.title || '', Validators.required],

      startDate: [startDate, Validators.required],
      startTime: [this.formatTimeForInput(startDate), Validators.required],

      endDate: [endDate, Validators.required],
      endTime: [this.formatTimeForInput(endDate), Validators.required],

      isAllDay: [event.isAllDay || false],

      // --- MODIFICA VALORI DI DEFAULT ---
      // Se event.description esiste E non è "Nessuna descrizione", usalo. Altrimenti, stringa vuota.
      description: [(event.description && event.description !== "Nessuna descrizione") ? event.description : ''],
      // Se event.type esiste E non è "Nessuno", usalo. Altrimenti, stringa vuota.
      type: [(event.type && event.type !== "Nessuno") ? event.type : ''],
      // 'null' è un valore valido qui, significa "Nessun promemoria"
      reminderMinutes: [event.reminderMinutes || null],
      // --- FINE MODIFICA ---

      color: [event.color || '#89b2f3'],
      showAs: [event.showAs || 'BUSY', Validators.required]
    });
  }

  ngOnInit(): void {}

  // --- NUOVO: Genera gli slot orari ---
  private generateTimeSlots(intervalMinutes: number) {
    this.timeSlots = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += intervalMinutes) {
        const hourStr = hour.toString().padStart(2, '0');
        const minuteStr = minute.toString().padStart(2, '0');
        this.timeSlots.push(`${hourStr}:${minuteStr}`);
      }
    }
  }

  // Helper per formattare solo l'ora (es. "14:30")
  private formatTimeForInput(date: Date): string {
    return formatDate(date, 'HH:mm', 'en-US');
  }

  // Helper per combinare Data e Ora in una stringa ISO
  private combineDateAndTime(date: Date, time: string): string {
    const [hours, minutes] = time.split(':');
    date.setHours(parseInt(hours, 10));
    date.setMinutes(parseInt(minutes, 10));
    date.setSeconds(0);
    // Rimuove la 'Z' finale per mandare l'ora locale al backend
    // che la interpreterà come LocalDateTime
    return date.toISOString().substring(0, 19);
  }

  onSave() {
    if (this.eventForm.invalid) return;
    this.isLoading = true;

    const formVal = this.eventForm.value;

    const startDateTime = this.combineDateAndTime(formVal.startDate, formVal.startTime);
    const endDateTime = this.combineDateAndTime(formVal.endDate, formVal.endTime);

    // --- MODIFICA SALVATAGGIO DTO ---
    const dto: EventDto = {
      title: formVal.title,
      start: startDateTime,
      end: endDateTime,
      isAllDay: formVal.isAllDay,

      // Se il campo è vuoto, invia il default. Altrimenti, invia il valore.
      description: formVal.description || 'Nessuna descrizione',
      type: formVal.type || 'Nessuno',

      // 'reminderMinutes' può essere inviato come 'null'
      reminderMinutes: formVal.reminderMinutes,

      color: formVal.color,
      showAs: formVal.showAs
    };

    const request = this.isNew
      ? this.eventService.createEvent(dto)
      : this.eventService.updateEvent(this.eventId!, dto);

    request.subscribe({
      next: () => this.dialogRef.close(true),
      error: (err) => {
        console.error(err);
        this.isLoading = false;
      }
    });
  }

  onDelete() {
    if (this.isNew || !this.eventId) return; // Non si può eliminare un evento nuovo

    this.isLoading = true;
    this.eventService.deleteEvent(this.eventId!).subscribe({
      next: () => {
        this.isLoading = false;
        this.dialogRef.close(true); // Chiudi e ricarica il calendario
      },
      error: (err) => {
        console.error("Errore durante l'eliminazione:", err);
        this.isLoading = false;
      }
    });
  }

  onCancel(): void {
    // Chiude il dialogo passando 'false' (o nessun valore)
    // per indicare che non è stato salvato nulla.
    this.dialogRef.close(false);
  }}
