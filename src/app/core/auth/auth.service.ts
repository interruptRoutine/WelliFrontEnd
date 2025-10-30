import { Injectable } from '@angular/core';
import {User} from './User';
import {HttpClient} from '@angular/common/http';
import {Router} from '@angular/router';


@Injectable({ providedIn: 'root' })
export class AuthService
{
  userInformation:User | null = null;

  constructor(private http: HttpClient, private router: Router)
  {
    this.letturaInfoUtente();
  }

  //TODO AGGIUNGERE ALTRI CAMPI UTENTE QUI, quelli che servono per la registrazione
  registration(username: string, password: string,email:string)
  {
    let body = {'username': username, 'password': password, 'email': email};
    this.http.post('/api/users/register', body).subscribe(
      //usa quando response 200
      () =>
      {
        this.letturaInfoUtente();
        this.router.navigate(['/']);
      },
      //usa quando response 400-500
      (error) =>
      {
        alert("Registration Failed");
      }
    );
  }

  letturaInfoUtente()
  {
    this.http.get<User>('/api/users/userinformation').subscribe(
      (user: User) => this.userInformation = user
    )
  }

  logout()
  {
    //1- imposto userInformation a null
    this.userInformation=null;
    //2 - cancella token
    document.cookie = 'token=; Path=/api/auth; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
  }

  login(email: string, password: string)
  {
    let body = {'email': email, 'password': password};
    this.http.post('/api/users/login', body).subscribe(
      //usa quando response 200
      () =>
      {
        this.letturaInfoUtente();
        this.router.navigate(['/']);
      },
      //usa quando response 400-500
      (error) =>
      {
        alert(error.message);
      }
    );
  }
}
