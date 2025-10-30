import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { EventInput } from '@fullcalendar/core';

// Interfaccia che mappa il tuo EventDto.java
export interface EventDto {
  id?: string;
  title: string;
  description: string;
  start: string;
  end: string;
  isAllDay: boolean;
  color: string;
  showAs: 'FREE' | 'BUSY' | 'TENTATIVE' | 'OUT_OF_OFFICE';
  recurrenceRule?: string;
  reminderMinutes?: number;
  type?: string;
}

export interface BackendEvent extends EventDto {
  id: string;
}

@Injectable({
  providedIn: 'root'
})
export class EventDataService {

  private apiUrl = '/api/events'; // Usa il proxy

  constructor(private http: HttpClient) { }

  // Funzione chiamata da FullCalendar
  loadEvents = (fetchInfo: any,
                successCallback: (events: EventInput[]) => void,
                failureCallback: (error: any) => void): void => {

    const params = new HttpParams()
      .set('start', fetchInfo.startStr)
      .set('end', fetchInfo.endStr);

    this.http.get<BackendEvent[]>(this.apiUrl, { params })
      .pipe(
        map(backendEvents => this.mapBackendToFullCalendar(backendEvents))
      )
      .subscribe(
        fcEvents => successCallback(fcEvents),
        error => failureCallback(error)
      );
  }

  // Il "TRADUTTORE" (Backend -> FullCalendar)
  private mapBackendToFullCalendar(events: BackendEvent[]): EventInput[] {
    console.log('Backend Events:', events); // <-- AGGIUNGI QUESTO LOG
    const mappedEvents = events.map(e => ({
      id: e.id,
      title: e.title,
      start: e.start, // Già in formato ISO
      end: e.end,     // Già in formato ISO
      allDay: e.isAllDay,
      color: e.color,
      rrule: e.recurrenceRule ? e.recurrenceRule : undefined,
      extendedProps: {
        description: e.description,
        showAs: e.showAs,
        type: e.type,
        reminderMinutes: e.reminderMinutes
      },
      display: e.showAs === 'OUT_OF_OFFICE' ? 'background' : 'auto',
      backgroundColor: e.showAs === 'FREE' ? '#c8e6c9' : e.color,
      borderColor: e.showAs === 'FREE' ? '#4CAF50' : e.color,
    }));
    console.log('Mapped FullCalendar Events:', mappedEvents); // <-- AGGIUNGI QUESTO LOG
    return mappedEvents;
  }

  // Funzioni CRUD chiamate dal Modal
  createEvent(dto: EventDto): Observable<BackendEvent> {
    return this.http.post<BackendEvent>(this.apiUrl, dto);
  }

  updateEvent(id: string, dto: EventDto): Observable<BackendEvent> {
    return this.http.put<BackendEvent>(`${this.apiUrl}/${id}`, dto);
  }

  deleteEvent(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
