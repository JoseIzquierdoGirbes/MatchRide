import { Component, EventEmitter, inject, Input, OnInit, Output, } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Viaje } from '../interfaces/viaje';
import { MapaComponent } from '../mapa/mapa.component';
import { UserService } from '../services/user.service';
import { FormsModule } from '@angular/forms';
import { User } from '../interfaces/user';
import { AutenticationService } from '../services/autentication.service';
import { ReservaService } from '../services/reserva.service';
import { Reserva } from '../interfaces/reserva';
import { ReservaComponent } from "../reserva/reserva.component";
import { ViajeService } from '../services/viaje.service';
import { Resena } from '../interfaces/resena';
import { ResenasService } from '../services/resenas.service';
import { flush } from '@angular/core/testing';
import { ResenaComponent } from "../resena/resena.component";
@Component({
  selector: 'app-viaje',
  imports: [FormsModule, MapaComponent, CommonModule, ReservaComponent, ResenaComponent],
  templateUrl: './viaje.component.html',
  styleUrl: './viaje.component.css'
})
export class ViajeComponent implements OnInit {

  @Input() viaje!: Viaje;
  @Input() viajePublicado!: boolean;
  @Input() reservasuser!: boolean;
  @Output() viajeEliminado = new EventEmitter<string>();

  usuarioConectado: User | null = null;
  usuario: User | null = null;
  userservice: UserService = inject(UserService);
  reservaservice: ReservaService = inject(ReservaService);
  resenaservice: ResenasService = inject(ResenasService);
  centerSalida!: google.maps.LatLngLiteral;
  markersSalida: google.maps.LatLngLiteral[] = [];
  centerLlegada!: google.maps.LatLngLiteral;
  markersLlegada: google.maps.LatLngLiteral[] = [];
  zoom = 12;
  authService: AutenticationService = inject(AutenticationService);
  viajeService: ViajeService = inject(ViajeService);
  puntuacionResena: number = 5;
  comentarioResena: string = '';
  activarresena = false;
  mostrarbotonresena = false;
  viajepasado = false;
  verresenas = false;
  reservas: Reserva[] = [];
  resenas: Resena[] = [];
  async ngOnInit() {
    this.authService.user$.subscribe(async userCred => {
      if (userCred) {
        this.usuarioConectado = await this.userservice.getById(userCred.uid);
      } else {
        this.usuarioConectado = null;
      }
    });
    try {
      this.usuario = await this.userservice.getById(this.viaje.organizadorId);
    } catch (err) {
      console.error('Error cargando organizador', err);
    }
    if (this.viajePublicado == true) {
      this.reservaservice.getByViaje(this.viaje.id).subscribe({
        next: (lista) => {
          this.reservas = lista;
        },
        error: (err) => console.error('Error al cargar las reservas', err)
      });
    }
    this.centerSalida = {
      lat: this.viaje.ubicacionSalida.lat,
      lng: this.viaje.ubicacionSalida.lng
    };
    this.markersSalida = [this.centerSalida];

    this.centerLlegada = {
      lat: this.viaje.ubicacionLlegada.lat,
      lng: this.viaje.ubicacionLlegada.lng
    };
    this.markersLlegada = [this.centerLlegada];



    if (this.reservasuser == true) {
      this.authService.user$.subscribe(async (user) => {
        if (user) {
          this.reservas = [];
          this.reservaservice.getByUsuario(user.uid).subscribe(async reservas => {
            this.reservas = reservas.filter(r => r.viajeid === this.viaje.id);

            const ahora = Date.now();
            const UN_DIA_MS = 1000 * 60 * 60 * 24;
            const fechaviaje = new Date(this.viaje.fecha).getTime();

            if (ahora > (fechaviaje + UN_DIA_MS)) {
              this.viajepasado = true;
              if (this.reservas[0].estado == 'aceptada') {
                const yaReseño = await this.resenaservice.existeResena(user.uid, this.viaje.id);
                if (!yaReseño) {
                  this.mostrarbotonresena = true;
                } else {
                  this.mostrarbotonresena = false;
                }

              }

            }
          });
        }


      });

    }


  }

  abrirFormResena() {
    this.mostrarbotonresena = false;
    this.activarresena = true;
    this.comentarioResena = "";
    this.puntuacionResena = 0;
  }
  async guardarResena() {
    if (!this.usuarioConectado) {
      alert('¡Inicia sesion o registrate para realizar tu reserva!');
      return;
    }

    this.activarresena = false;
    const resena: Resena = {
      id: " ",
      viajeid: this.viaje.id,
      userid: this.usuarioConectado?.uid,
      usercalificado: this.viaje.organizadorId,
      calificacion: Number(this.puntuacionResena),
      comentario: this.comentarioResena,
      fecha: new Date().toISOString()
    }

    try {
      this.resenaservice.save(resena);
      await this.resenaservice.updateUserAverageRating(resena.usercalificado, resena.calificacion);
      alert('¡Se ha realizado su reseña!');

    } catch (e) {
      console.error('Error al reservar:', e);
      alert('Hubo un problema al realizar la reserva. Intenta de nuevo.');
    }
  }
  reservar() {
    if (!this.usuarioConectado) {
      alert('¡Inicia sesion o registrate para realizar tu reserva!');
      return;
    }
    const reserva: Reserva = {
      id: '',
      viajeid: this.viaje.id,
      usuarioid: this.usuarioConectado.uid,
      estado: 'pendiente',
      fecha: new Date().toISOString()
    };

    try {
      this.reservaservice.save(reserva);
      alert('¡Se ha realizado su reserva!');

    } catch (e) {
      console.error('Error al reservar:', e);
      alert('Hubo un problema al realizar la reserva. Intenta de nuevo.');
    }

  }

  eliminarviaje() {
    if (!confirm('¿Estás seguro de que quieres eliminar este viaje?')) {
      return;
    }
    this.viajeService.delete(this.viaje.id)
      .then(() => {
        // Emitimos el ID al padre
        this.viajeEliminado.emit(this.viaje.id);
      })
      .catch(err => console.error('Error al eliminar viaje', err));
  }

  verResenas() {
    this.verresenas = true;
    if (this.viajePublicado || this.reservasuser) {
      this.resenaservice.getByViaje(this.viaje.id).subscribe(rs => {
        this.resenas = rs;
      })
    } else {
      this.resenaservice.getByUsuarioCalidficado(this.viaje.organizadorId).subscribe(rs => {
        this.resenas = rs;
      })
    }



  }
  cerrarresenas() {
    this.verresenas = false;
  }

  cerarCrearResena(){
    this.activarresena=false;
    this.mostrarbotonresena = true;
    this.comentarioResena = "";
    this.puntuacionResena = 0;
  }

  
}
