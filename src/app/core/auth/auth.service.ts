import { Injectable } from '@angular/core';

const TOKEN_KEY = 'token';

@Injectable({ providedIn: 'root' })
export class AuthService {
  getToken(): string | null { return localStorage.getItem(TOKEN_KEY); }
  setToken(token: string): void { localStorage.setItem(TOKEN_KEY, token); }
  clearToken(): void { localStorage.removeItem(TOKEN_KEY); }
  isAuthenticated(): boolean { return !!this.getToken(); }
}
