import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { MoodRequestDTO, MoodResponseDTO } from './mood.types';


@Injectable({ providedIn: 'root' })
export class MoodService {
  private http = inject(HttpClient);
  setMood(payload: MoodRequestDTO): Observable<MoodResponseDTO> {
    return this.http.post<MoodResponseDTO>(`api/mood`, payload);
  }
  getToday(): Observable<MoodResponseDTO> {
    return this.http.get<MoodResponseDTO>(`api/mood`);
  }
}
