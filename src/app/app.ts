import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import {AuthService} from './core/auth/auth.service';
import {FormsModule} from '@angular/forms';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, FormsModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  email:string="";
  password:string="";

  constructor(public auth:AuthService) {}

  logga()
  {
    this.auth.login(this.email,this.password);
  }
}
