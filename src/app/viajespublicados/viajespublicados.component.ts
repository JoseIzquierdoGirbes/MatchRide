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


@Component({
  selector: 'app-viajespublicados',
  imports: [FormsModule, CommonModule, RouterModule, ViajeComponent],
  templateUrl: './viajespublicados.component.html',
  styleUrl: './viajespublicados.component.css'
})
export class ViajespublicadosComponent {
  router: Router = inject(Router);
  route = inject(ActivatedRoute);
  userservice: UserService = inject(UserService);
  viajeservice: ViajeService = inject(ViajeService);
  authService: AutenticationService = inject(AutenticationService);

  usuario: User | null = null;

  collapsed = signal(false);

  viajes: Viaje[] = [];
  viajesPublicados: Viaje[] = [];



  constructor() {
    this.authService.user$.subscribe(async (user) => {
      if (user) {
        this.usuario = await this.userservice.getById(user.uid);
        this.viajeservice.getAll().subscribe({
          next: (lista) => {
            this.viajesPublicados = lista.filter(v => v.organizadorId === this.usuario!.uid);
          },
          error: (err) => console.error('Error al cargar viajes', err)
        });
      } else {
        this.router.navigate(['/inicio']);
      }

    });

  }

  onViajeEliminado(id: string) {
  this.viajesPublicados = this.viajesPublicados.filter(v => v.id !== id);
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
