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
import { ViajespublicadosComponent } from "../viajespublicados/viajespublicados.component";
import { ReservaService } from '../services/reserva.service';
import { first } from 'rxjs';

@Component({
  selector: 'app-incicio',
  imports: [FormsModule, CommonModule, RouterModule, ViajeComponent],
  templateUrl: './incicio.component.html',
  styleUrl: './incicio.component.css'
})
export class IncicioComponent {
  router: Router = inject(Router);
  route = inject(ActivatedRoute);
  userservice: UserService = inject(UserService);
  viajeservice: ViajeService = inject(ViajeService);
  authService: AutenticationService = inject(AutenticationService);
  reservaservice: ReservaService = inject(ReservaService);
  usuario: User | null = null;

  collapsed = signal(false);

  viajes: Viaje[] = [];
  viajesPublicados: Viaje[] = [];
  proximosIds: string[] = [];


  constructor() {
    this.authService.user$.pipe(first()).subscribe(async user => {
      if (user) {
        this.usuario = await this.userservice.getById(user.uid);
      }
      this.viajeservice.getAll().subscribe({
        next: lista => this.applyFilter(lista),
        error: err => console.error('Error al cargar viajes', err)
      });
    });



  }
  applyFilter(lista: Viaje[]) {
    if (this.usuario) {
      this.viajes = lista.filter(v => v.organizadorId !== this.usuario!.uid);

      this.reservaservice.getByUsuario(this.usuario.uid).subscribe(reservas => {
        const reservadosIds = new Set(reservas.map(r => r.viajeid));
        this.viajes = this.viajes.filter(v => !reservadosIds.has(v.id));
      })
      this.filtrarHoraSalida(this.viajes);

    } else {
      this.viajes = lista;
      this.filtrarHoraSalida(this.viajes);
    }
  }

  filtrarHoraSalida(listaviajes: Viaje[]) {
    const ahora = Date.now();
    const UNA_HORA = 1000 * 60 * 60;

    // 1. Separa los que faltan ≤ 1h
    const sininactivos = listaviajes.filter(v => v.inactivo !== true);
    console.log(listaviajes.length);
    console.log(listaviajes);
    console.log(sininactivos.length);
    sininactivos.forEach(element => {
      console.log(element.fecha);
    });
    const proximos = sininactivos.filter(v => {
      const diff = new Date(v.fecha).getTime() - ahora;
      return  diff <= UNA_HORA;
    });

    // guarda sus IDs
    this.proximosIds = proximos.map(v => v.id);


   
    if (this.proximosIds.length > 0) {
      this.viajeservice.markInactive(this.proximosIds);
    }

    // 3. Filtra los que quedan > 1h para mostrarlos en la UI
    this.viajes = listaviajes.filter(v => {
      const diff = new Date(v.fecha).getTime() - ahora;
      return diff > UNA_HORA;
    });
  }


  async signOut() {
    try {
      await this.authService.logout();
      console.log('User signed out');
      location.reload();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  }





}

