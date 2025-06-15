import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { Reserva } from '../interfaces/reserva';
import { User } from '../interfaces/user';
import { UserService } from '../services/user.service';
import { CommonModule } from '@angular/common';
import { ReservaService } from '../services/reserva.service';


@Component({
  selector: 'app-reserva',
  imports: [CommonModule],
  templateUrl: './reserva.component.html',
  styleUrl: './reserva.component.css'
})
export class ReservaComponent {
@Input() reserva!: Reserva;
@Input() reservasuser!: boolean;
usuario: User | null = null;
userservice: UserService = inject(UserService);
reservaservice:ReservaService=inject(ReservaService);
 async ngOnChanges() {
  try {
      this.usuario = await this.userservice.getById(this.reserva.usuarioid);
    } catch (err) {
      console.error('Error cargando organizador', err);
    }
 }
 async aceptarReserva(){
  try {
      await this.reservaservice.aceptarReserva(this.reserva);
      this.reserva.estado = 'aceptada';
    } catch (e) {
      console.error('Error al aceptar:', e);
    }
 }
 async rechazarReserva(){
  try {
      await this.reservaservice.rechazarReserva(this.reserva);
      this.reserva.estado = 'cancelada';
    } catch (e) {
      console.error('Error al rechazar:', e);
    }
 }

 async cancelarReserva() {
  try {
    await this.reservaservice.cancelarReserva(this.reserva);
    this.reserva.estado = 'cancelada';
  } catch (e) {
    console.error('Error al cancelar en componente:', e);
  }
}
}
