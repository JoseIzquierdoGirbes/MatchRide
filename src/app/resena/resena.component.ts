
import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { Resena } from '../interfaces/resena';
import { User } from '../interfaces/user';
import { UserService } from '../services/user.service';
import { CommonModule } from '@angular/common';
import { ResenasService } from '../services/resenas.service';
import { FormsModule } from '@angular/forms';
@Component({
  selector: 'app-resena',
  imports: [CommonModule],
  templateUrl: './resena.component.html',
  styleUrl: './resena.component.css'
})
export class ResenaComponent {
@Input() resena!: Resena;
@Input() reservasuser!: boolean;
@Output() resenaEliminada = new EventEmitter<string>();
usuario: User | null = null;
userservice: UserService = inject(UserService);
resenaservice:ResenasService=inject(ResenasService);
 async ngOnChanges() {
  try {
      this.usuario = await this.userservice.getById(this.resena.userid);
    } catch (err) {
      console.error('Error cargando organizador', err);
    }
 }

 eliminarResena() {
  if (!confirm('¿Eliminar esta reseña?')) return;
  this.resenaservice.deleteAndUpdateRating(this.resena.id,this.resena.usercalificado,this.resena.calificacion)
    .then(() => {
      // Recarga completa de la página
      location.reload();
    })
    .catch(err => {
      console.error('Error al eliminar reseña', err);
      alert('No se pudo eliminar la reseña');
    });
}
}
