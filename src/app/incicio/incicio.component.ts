import { Component, inject, OnInit, signal } from '@angular/core';

import { AutenticationService } from '../services/autentication.service';
import { UserService } from '../services/user.service';
import { User } from '../interfaces/user';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
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
  imports: [ReactiveFormsModule,FormsModule, CommonModule, RouterModule, ViajeComponent],
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
  viajesFiltrados: Viaje[] = [];
 
  proximosIds: string[] = [];

  filtroSalida: string = '';
  filtroLlegada: string = '';
  filtroFecha= ''; 
  ciudadesSalida:string[]=[];
  ciudadesLlegada:string[]=[];

   minDateTime!: string;


  constructor() {
    this.authService.user$.pipe(first()).subscribe(async user => {
      if (user) {
        this.usuario = await this.userservice.getById(user.uid);
      }
      
      this.viajeservice.getAll().subscribe(lista=>{
        this.filtrarlista(lista);
        this.setMinDateTime();
      });
    });



  }
  filtrarlista(lista: Viaje[]) {
    if (this.usuario) {
      this.viajes = lista.filter(v => v.organizadorId !== this.usuario!.uid);

      this.reservaservice.getByUsuario(this.usuario.uid).subscribe(reservas => {
        const reservadosIds = new Set(reservas.map(r => r.viajeid));
        this.viajes = this.viajes.filter(v => !reservadosIds.has(v.id));
      })
      
    } else {
      this.viajes = lista;
    
    }
    this.filtrarHoraSalida(this.viajes);
    this.rellenarfiltros(this.viajes);
    this.aplicarFiltros();
  }

  filtrarHoraSalida(listaviajes: Viaje[]) {
    const ahora = Date.now();
    const UNA_HORA = 1000 * 60 * 60;

    // 1. Separa los que faltan ≤ 1h
    const sininactivos = listaviajes.filter(v => v.inactivo !== true);
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

  rellenarfiltros(lista: Viaje[]){
    const salidas = lista.map(v => v.ubicacionSalida.ciudad);
  const llegadas = lista.map(v => v.ubicacionLlegada.ciudad);

  
  this.ciudadesSalida  = Array.from(new Set(salidas));
  this.ciudadesLlegada = Array.from(new Set(llegadas));
  }

   aplicarFiltros() {
   this.viajesFiltrados = this.viajes.filter(v => {
      const okSalida  = !this.filtroSalida  || v.ubicacionSalida.ciudad  === this.filtroSalida;
      const okLlegada = !this.filtroLlegada || v.ubicacionLlegada.ciudad === this.filtroLlegada;

    let okFecha = true;
    if (this.filtroFecha) {
      // extraemos YYYY-MM-DD de la fecha ISO del viaje
      const viajeYYYYMMDD = v.fecha.substring(0, 10);
      okFecha = viajeYYYYMMDD === this.filtroFecha;
    }

      return okSalida && okLlegada && okFecha;
    });
  }


  limpiarfiltros(){
    this.filtroSalida  = '';
    this.filtroLlegada = '';
     this.filtroFecha   = '';
    this.aplicarFiltros();
  }

   private setMinDateTime() {
    const now = new Date();

    
    const pad = (n: number) => n.toString().padStart(2, '0');
    const year   = now.getFullYear();
    const month  = pad(now.getMonth() + 1);
    const day    = pad(now.getDate());
  
    this.minDateTime = `${year}-${month}-${day}`;
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

