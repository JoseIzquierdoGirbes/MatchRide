import { Component, inject, OnInit, signal } from '@angular/core';

import { AutenticationService } from '../services/autentication.service';
import { UserService } from '../services/user.service';
import { User } from '../interfaces/user';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ViajeComponent } from "../viaje/viaje.component";
import { ViajeService } from '../services/viaje.service';
import { Viaje } from '../interfaces/viaje';
import { ReservaService } from '../services/reserva.service';
import { Reserva } from '../interfaces/reserva';

@Component({
  selector: 'app-reservas',
  imports: [FormsModule, CommonModule, RouterModule, ViajeComponent],
  templateUrl: './reservas.component.html',
  styleUrl: './reservas.component.css'
})
export class ReservasComponent {
cancelarResena() {
throw new Error('Method not implemented.');
}
guardarResena() {
throw new Error('Method not implemented.');
}
  router: Router = inject(Router);
  route = inject(ActivatedRoute);
  userservice: UserService = inject(UserService);
  viajeservice: ViajeService = inject(ViajeService);
  authService: AutenticationService = inject(AutenticationService);
  reservasservice: ReservaService = inject(ReservaService);
  usuario: User | null = null;
  viajeResena:Viaje| null = null;
  reservasResena:Reserva| null = null;
  puntuacionResena: number = 5;
  comentarioResena: string = '';
  collapsed = signal(false);


  viajesReservados: Viaje[] = [];



  constructor() {
    this.authService.user$.subscribe(async user => {
      if (!user) {
        this.router.navigate(['/inicio']);
        return;
      }

      this.usuario = (await this.userservice.getById(user.uid));
      this.viajesReservados = [];

      this.reservasservice.getByUsuario(user.uid).subscribe(reservas => {

        reservas.forEach(res => {
          this.viajeservice.getById(res.viajeid).subscribe(viaje => {
            if (!this.viajesReservados.find(v => v.id === viaje.id)) {
                this.viajesReservados.push(viaje);
            }
          });
        });

      });
    });
  }



  async signOut() {
    try {
      await this.authService.logout();
      location.reload();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  }
}
