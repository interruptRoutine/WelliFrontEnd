import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { MoodRequestDTO, MoodResponseDTO } from './mood.types';

const API_BASE = 'http://localhost:8080';

@Injectable({ providedIn: 'root' })
export class MoodService {
  private http = inject(HttpClient);
  setMood(payload: MoodRequestDTO): Observable<MoodResponseDTO> {
    return this.http.post<MoodResponseDTO>(`${API_BASE}/mood`, payload);
  }
  getToday(): Observable<MoodResponseDTO> {
    return this.http.get<MoodResponseDTO>(`${API_BASE}/mood`);
  }
}
