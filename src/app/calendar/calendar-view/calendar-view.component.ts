import {Component, LOCALE_ID, ViewChild} from '@angular/core';
import { CommonModule } from '@angular/common';

// Import di FullCalendar
import { FullCalendarComponent, FullCalendarModule } from '@fullcalendar/angular';
import { CalendarOptions, DateSelectArg, EventClickArg, EventChangeArg } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import interactionPlugin from '@fullcalendar/interaction';
import rrulePlugin from '@fullcalendar/rrule'; // Per la ricorrenza
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
    FullCalendarModule, // Importa FullCalendar QUI
    MatDialogModule     // Importa MatDialog QUI
  ],
  templateUrl: './calendar-view.component.html',
  styleUrls: ['./calendar-view.component.css']
})
export class CalendarViewComponent {

  @ViewChild('calendar') calendarComponent!: FullCalendarComponent;

  // Dichiariamo calendarOptions qui
  calendarOptions: CalendarOptions;

  constructor(
    private eventService: EventDataService,
    public dialog: MatDialog
  ) {

    // --- CORREZIONE 1: Inizializza calendarOptions nel costruttore ---
    // In questo modo, 'this' è disponibile e 'this.eventService' è definito.
    this.calendarOptions = {
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

      // Ora 'this.eventService.loadEvents' è sicuro da usare
      events: this.eventService.loadEvents,

      select: this.handleDateSelect.bind(this),
      eventClick: this.handleEventClick.bind(this),
      eventChange: this.handleEventChange.bind(this),
      slotLabelFormat: {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false // 3. Forza il formato 24 ore
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

  // APRE MODAL PER NUOVO EVENTO
  handleDateSelect(selectInfo: DateSelectArg) {
    selectInfo.view.calendar.unselect();
    const dataForModal = {
      start: selectInfo.startStr,
      end: selectInfo.endStr,
      isAllDay: selectInfo.allDay
    };
    this.openEventModal(dataForModal);
  }

  // APRE MODAL PER EVENTO ESISTENTE
  handleEventClick(clickInfo: EventClickArg) {
    const event = clickInfo.event;

    // --- CORREZIONE 2: Usa extendedProps per 'recurrenceRule' ---
    const dataForModal = {
      ...event.extendedProps,
      id: event.id,
      title: event.title,
      start: event.startStr,
      end: event.endStr,
      isAllDay: event.allDay,
      color: event.backgroundColor,

      // Usa il campo che abbiamo salvato in extendedProps, non l'oggetto rrule
      recurrenceRule: event.extendedProps['recurrenceRule']
    };

    this.openEventModal(dataForModal, event.id);
  }

  // SALVA DRAG-AND-DROP
  handleEventChange(changeInfo: EventChangeArg) {
    const event = changeInfo.event;
    const endDate = event.endStr || event.startStr;

    // --- CORREZIONE 2 (anche qui): Usa extendedProps ---
    const dto: EventDto = {
      title: event.title,
      description: event.extendedProps['description'],
      start: event.startStr,
      end: endDate,
      isAllDay: event.allDay,
      color: event.backgroundColor,
      showAs: event.extendedProps['showAs'],

      // Usa il campo che abbiamo salvato in extendedProps
      recurrenceRule: event.extendedProps['recurrenceRule'],

      reminderMinutes: event.extendedProps['reminderMinutes'],
      type: event.extendedProps['type']
    };

    this.eventService.updateEvent(event.id, dto).subscribe({
      error: (err) => {
        console.error("Errore durante l'aggiornamento (drag/resize):", err);
        changeInfo.revert();
      }
    });
  }

  // FUNZIONE APRI-MODAL (invariata)
  openEventModal(data: any, id?: string) {
    const dialogRef = this.dialog.open(EventModalComponent, {
      width: '600px',
      data: {
        eventData: data,
        id: id
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        this.calendarComponent.getApi().refetchEvents();
      }
    });
  }
}
