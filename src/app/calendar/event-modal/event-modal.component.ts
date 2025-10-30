import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule, formatDate } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { EventDataService, EventDto } from '../event-data.service';

// Importa tutti i moduli di Material necessari
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';

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
    MatDatepickerModule,
    MatNativeDateModule
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
    this.isNew = data.isNew;
    this.eventId = data.eventData?.id || null;
    const event = data.eventData || {};

    // Inizializzazione delle date: Le stringhe ISO di FullCalendar vengono convertite in Date.
    const startDate = event.start ? new Date(event.start) : new Date();
    const endDate = event.end ? new Date(event.end) : new Date(startDate.getTime() + 60 * 60 * 1000); // Default +1 ora

    this.generateTimeSlots(30);

    // ✨ CORREZIONE RICHIESTA: Usa l'ora della data fornita (00:00 se non specificata) ✨
    // Ho rimosso completamente la logica dell'ora corrente.
    const initialStartTime = this.formatTimeForInput(startDate);
    const initialEndTime = this.formatTimeForInput(endDate);

    this.eventForm = this.fb.group({
      title: [event.title || '', Validators.required],

      startDate: [startDate, Validators.required],
      startTime: [initialStartTime, Validators.required],

      endDate: [endDate, Validators.required],
      endTime: [initialEndTime, Validators.required],

      isAllDay: [event.isAllDay || false],

      description: [(event.description && event.description !== "Nessuna descrizione") ? event.description : ''],
      type: [(event.type && event.type !== "Nessuno") ? event.type : ''],
      reminderMinutes: [event.reminderMinutes || null],

      color: [event.color || '#89b2f3'],
      showAs: [event.showAs || 'BUSY', Validators.required]
    });
  }

  ngOnInit(): void
  {
    // Logica di gestione isAllDay per disabilitare/abilitare l'ora se necessario
    this.eventForm.get('isAllDay')?.valueChanges.subscribe(isAllDay => {
      const startTimeControl = this.eventForm.get('startTime');
      const endTimeControl = this.eventForm.get('endTime');

      if (isAllDay) {
        startTimeControl?.disable();
        endTimeControl?.disable();
      } else {
        startTimeControl?.enable();
        endTimeControl?.enable();
      }
    });
  }

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

  /**
   * Helper che estrae HH:mm dalla data, mostrerà 00:00 se l'ora è midnight.
   */
  private formatTimeForInput(date: Date): string {
    return formatDate(date, 'HH:mm', 'en-US');
  }

  /**
   * ✨ RIMOSSA: Non serve più la logica complessa sull'ora corrente.
   private getInitialTimeForModal(date: Date, isAllDay: boolean, isEnd: boolean = false): string {
   // ... (Logica rimossa per rispettare la tua richiesta)
   return this.formatTimeForInput(date);
   }
   */

  /**
   * Converte un oggetto Date (dal datepicker) in una stringa 'YYYY-MM-DD'
   * usando i suoi valori locali, per evitare la conversione UTC.
   */
  private toLocalDateString(date: Date): string {
    if (!date) return '';
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Genera la stringa finale 'YYYY-MM-DDTHH:mm:ss' per il backend (LocalDateTime).
   * La parte 'time' proviene dal MatSelect.
   */
  private toLocalDateTimeString(date: Date, time: string, isAllDay: boolean): string {
    const datePart = this.toLocalDateString(date);

    // Se all-day, usa T00:00:00. Altrimenti usa l'ora selezionata.
    const timePart = isAllDay ? '00:00' : (time || '00:00');

    return `${datePart}T${timePart}:00`;
  }

  onSave() {
    this.eventForm.markAllAsTouched();
    if (this.eventForm.invalid) {
      console.warn('Form non valido!');
      return;
    }

    this.isLoading = true;
    const formValues = this.eventForm.getRawValue();

    // Determina le date/ore corrette per il DTO
    const startForDto = this.toLocalDateTimeString(
      formValues.startDate,
      formValues.startTime,
      formValues.isAllDay
    );

    const endForDto = this.toLocalDateTimeString(
      formValues.endDate,
      formValues.endTime,
      formValues.isAllDay
    );

    // Costruisci il DTO
    const dto: EventDto = {
      title: formValues.title,
      description: formValues.description ?? null,

      start: startForDto,
      end: endForDto,

      isAllDay: formValues.isAllDay,
      color: formValues.color,
      showAs: formValues.showAs ?? 'BUSY',
      reminderMinutes: formValues.reminderMinutes ?? null,
      type: formValues.type ?? null
    };

    // Chiama il servizio corretto
    const saveOperation = this.isNew
      ? this.eventService.createEvent(dto)
      : this.eventService.updateEvent(this.eventId!, dto);

    saveOperation.subscribe({
      next: (savedEvent) => {
        this.isLoading = false;
        // Chiudi il modal restituendo l'evento salvato (che ora include l'ID se era nuovo)
        this.dialogRef.close(savedEvent);
      },
      error: (err) => {
        this.isLoading = false;
        console.error('ERRORE SALVATAGGIO MODAL:', err.error);
        this.dialogRef.close(null);
      }
    });
  }

  onDelete() {
    if (this.isNew || !this.eventId) return;

    this.isLoading = true;
    this.eventService.deleteEvent(this.eventId!).subscribe({
      next: () => {
        this.isLoading = false;
        // Chiudi restituendo una stringa 'DELETED'
        this.dialogRef.close('DELETED');
      },
      error: (err) => {
        console.error("Errore durante l'eliminazione:", err);
        this.isLoading = false;
        this.dialogRef.close(null); // Chiudi senza aggiornare
      }
    });
  }

  onCancel(): void {
    this.dialogRef.close(null); // Restituisce null per indicare annullamento
  }
}
