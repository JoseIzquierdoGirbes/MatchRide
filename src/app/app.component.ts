import { Component, inject } from '@angular/core';
import { AutenticationService } from './services/autentication.service';
import { UserService } from './services/user.service';
import { User } from './interfaces/user';
import { FormsModule } from '@angular/forms';
import { Router,RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
@Component({
  selector: 'app-root',
  imports: [ FormsModule,CommonModule,RouterModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  authService: AutenticationService = inject(AutenticationService);
  userservice:UserService = inject(UserService);
  usuario: User | null = null;

  constructor(){
    this.authService.user$.subscribe(async (user) => {
      if (user) {
        this.usuario = await this.userservice.getById(user.uid);
      }
    });
  }
  
}
