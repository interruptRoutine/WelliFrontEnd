import {AfterViewInit, Component, OnDestroy, OnInit, ViewChild} from '@angular/core';
import { CommonModule } from '@angular/common';

// Import di FullCalendar
import { FullCalendarComponent, FullCalendarModule } from '@fullcalendar/angular';
import {
  CalendarApi, // <-- Importa CalendarApi
  CalendarOptions,
  DateSelectArg,
  EventClickArg,
  EventChangeArg,
  EventInput // <-- Importa EventInput per il tipo
} from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import interactionPlugin from '@fullcalendar/interaction';
import rrulePlugin from '@fullcalendar/rrule';
import itLocale from '@fullcalendar/core/locales/it';

// Import di Angular Material per i Modal
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

// Import dei nostri servizi e componenti
import { EventDataService, EventDto } from '../event-data.service';
import { EventModalComponent } from '../event-modal/event-modal.component';

@Component({
  selector: 'app-calendar-view',
  standalone: true,
  imports: [
    CommonModule,
    FullCalendarModule,
    MatDialogModule
  ],
  templateUrl: './calendar-view.component.html',
  styleUrls: ['./calendar-view.component.css']
})
// Pulito: rimosso OnInit, OnDestroy (non usati)
export class CalendarViewComponent implements AfterViewInit {

  @ViewChild('calendar') calendarComponent!: FullCalendarComponent;

  // 1. DICHIARA LA VARIABILE CHE MANCAVA
  private calendarApi!: CalendarApi;

  calendarOptions: CalendarOptions;

  constructor(
    private eventService: EventDataService,
    public dialog: MatDialog
  ) {
    this.calendarOptions = {
      // ... (tutte le tue opzioni plugins, headerToolbar, ecc.) ...
      plugins: [
        dayGridPlugin,
        timeGridPlugin,
        listPlugin,
        interactionPlugin,
        rrulePlugin
      ],
      headerToolbar: {
        left: 'prev,next today',
        center: 'title',
        right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek'
      },
      initialView: 'dayGridMonth',
      weekends: true,
      editable: true,
      selectable: true,
      events: this.eventService.loadEvents,
      select: this.handleDateSelect.bind(this),
      eventClick: this.handleEventClick.bind(this),
      eventChange: this.handleEventChange.bind(this),
      slotLabelFormat: {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      },
      eventTimeFormat: {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      },
      timeZone: 'local',
      locale: itLocale
    };
  }

  // 2. INIZIALIZZA L'API DOPO CHE LA VISTA È PRONTA
  ngAfterViewInit() {
    if (this.calendarComponent) {
      this.calendarApi = this.calendarComponent.getApi();
    } else {
      console.error("ERRORE: #calendar non trovato.");
    }
  }

  // APRE MODAL PER NUOVO EVENTO
  handleDateSelect(selectInfo: DateSelectArg) {
    selectInfo.view.calendar.unselect();
    const dataForModal = {
      start: selectInfo.startStr,
      end: selectInfo.endStr,
      isAllDay: selectInfo.allDay
    };
    // Chiama la funzione centralizzata
    this.openEventModal(dataForModal, true);
  }

  // APRE MODAL PER EVENTO ESISTENTE
  handleEventClick(clickInfo: EventClickArg) {
    const event = clickInfo.event;
    const dataForModal = {
      ...event.extendedProps,
      id: event.id,
      title: event.title,
      start: event.startStr,
      end: event.endStr,
      isAllDay: event.allDay,
      color: event.backgroundColor
    };
    // Chiama la funzione centralizzata
    this.openEventModal(dataForModal, false);
  }

  // 3. SALVA DRAG-AND-DROP (AGGIUNTO IL SUBSCRIBE MANCANTE)
  handleEventChange(changeInfo: EventChangeArg) {
    const event = changeInfo.event;

    let startStr: string;
    let endStr: string;

    if (event.allDay) {
      startStr = event.startStr;
      endStr = event.endStr || startStr;
    } else {
      // Pulisce il fuso orario per il server Java
      startStr = event.startStr.substring(0, 19);
      endStr = event.endStr ? event.endStr.substring(0, 19) : startStr;
    }

    const dto: EventDto = {
      title: event.title,
      start: startStr,
      end: endStr,
      isAllDay: event.allDay,
      description: event.extendedProps['description'] ?? null,
      color: event.backgroundColor ?? null,
      showAs: event.extendedProps['showAs'] ?? 'BUSY',
      reminderMinutes: event.extendedProps['reminderMinutes'] ?? null,
      type: event.extendedProps['type'] ?? null
    };

    // --- AGGIUNTO BLOCCO SALVATAGGIO MANCANTE ---
    this.eventService.updateEvent(event.id, dto).subscribe({
      next: () => {
        console.log('Drag/Resize salvato.');
      },
      error: (err) => {
        console.error("Errore salvataggio (drag/resize):", err.error);
        changeInfo.revert(); // Annulla la modifica
      }
    });
    // ----------------------------------------------
  }

  openEventModal(data: any, isNew: boolean) {
    const dialogRef = this.dialog.open(EventModalComponent, {
      width: '600px',
      data: {
        eventData: data,
        isNew: isNew
      },
      panelClass: 'font-verdana'
    });

    // Logica di aggiornamento centralizzata
    dialogRef.afterClosed().subscribe(result => {
      // 'result' può essere l'evento DTO salvato, la stringa 'DELETED', o null (annullamento)
      if (!this.calendarApi) return;

      const eventId = data.id; // L'ID originale dell'evento (esistente o no)
      const existingEvent = this.calendarApi.getEventById(eventId);

      if (result === 'DELETED') {
        // 1. GESTIONE ELIMINAZIONE
        if (existingEvent) {
          existingEvent.remove();
          console.log(`Evento ID ${eventId} rimosso dal calendario.`);
        }
        return;
      }

      if (result && result.id) { // Controlla che result non sia null e abbia un ID (quindi è un DTO Evento salvato)
        // 2. GESTIONE CREAZIONE O MODIFICA

        const eventInput = this.convertDtoToEvent(result); // DTO -> Evento FullCalendar

        if (existingEvent) {
          // Se esisteva (Modifica), rimuoviamo la versione vecchia
          existingEvent.remove();
        }

        // Aggiunge la nuova versione (valido sia per new che per update)
        this.calendarApi.addEvent(eventInput);
      }
    });
  }

  // Funzione helper (invariata)
  private convertDtoToEvent(dto: EventDto): EventInput {
    return {
      id: dto.id,
      title: dto.title,
      start: dto.start, // Il DTO ora ha la stringa pulita
      end: dto.end,
      allDay: dto.isAllDay,
      backgroundColor: dto.color,
      extendedProps: {
        description: dto.description,
        showAs: dto.showAs,
        type: dto.type,
        reminderMinutes: dto.reminderMinutes
      }
    };
  }
}
