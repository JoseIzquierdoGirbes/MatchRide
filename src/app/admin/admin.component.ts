import { Component, inject, OnInit, signal } from '@angular/core';
import { AutenticationService } from '../services/autentication.service';
import { UserService } from '../services/user.service';
import { User } from '../interfaces/user';
import { Viaje } from '../interfaces/viaje';
import { Router, RouterModule } from '@angular/router';
import { EquiposService } from '../services/equipos.service';
import { ViajeService } from '../services/viaje.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Reserva } from '../interfaces/reserva';
import { ReservaService } from '../services/reserva.service';
import { ReservaConExtra } from '../interfaces/reservasConExtra'
import { firstValueFrom } from 'rxjs';
import { ViajeConExtra } from '../interfaces/viajeConExtra';
import { ResenasService } from '../services/resenas.service';
import { ResenaConExtra } from '../interfaces/resenasConExtra';

@Component({
  selector: 'app-admin',
  imports: [RouterModule, CommonModule, FormsModule],
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.css'
})
export class AdminComponent implements OnInit {

  usuarios: User[] = [];
  todosLosViajes: ViajeConExtra[] = [];
  todasLasReservas: ReservaConExtra[] = [];

  totalUsuarios = 0;
  totalViajes = 0;
  totalReservasActivas = 0;



  router: Router = inject(Router);
  authService: AutenticationService = inject(AutenticationService);
  userservice: UserService = inject(UserService);
  reservasservice: ReservaService = inject(ReservaService);
  usuario: User | null = null;
  viaje: Viaje | undefined;
  collapsed = signal(false);
  viajeservice: ViajeService = inject(ViajeService);
  todasLasResenas: ResenaConExtra[] = [];
  totalResenas = 0;
  resenasService: ResenasService = inject(ResenasService);


  ngOnInit(): void {
    this.authService.user$.subscribe(async user => {
      if (!user) {
        this.router.navigate(['/inicio']);
        return;
      }

      this.usuario = await this.userservice.getById(user.uid);
      if (this.usuario?.rol !== 'administrador' && this.usuario?.rol !== 'admin') {
        this.router.navigate(['/inicio']);
        return;
      }


      this.cargarUsuarios();
      this.cargarViajesConExtra();
      this.cargarReservasConExtra();
      this.cargarResenasConExtra();
    });
  }

  private cargarUsuarios() {
    this.userservice.getAll().subscribe(users => {
      this.usuarios = users;
      this.totalUsuarios = users.length;
    });
  }

  private cargarViajesConExtra() {
    this.viajeservice.getAll().subscribe(async viajes => {
      const temp: ViajeConExtra[] = viajes.map(v => ({
        ...v,
        organizadorUsername: ''
      }));

      for (let i = 0; i < temp.length; i++) {
        const v = temp[i];
        try {
          const user = await this.userservice.getById(v.organizadorId);
          temp[i].organizadorUsername = user?.username || 'Desconocido';
        } catch {
          temp[i].organizadorUsername = 'Desconocido';
        }
      }

      this.todosLosViajes = temp;
      this.totalViajes = temp.length;
    });
  }

  private cargarReservasConExtra() {
    this.reservasservice.getAll().subscribe(async reservas => {
      const temp: ReservaConExtra[] = reservas.map(r => ({
        ...r,
        usuarioUsername: '',
        viajePartido: ''
      }));


      for (let i = 0; i < temp.length; i++) {
        const r = temp[i];
        try {
          const u = await this.userservice.getById(r.usuarioid);
          if (u) {
            temp[i].usuarioUsername = u.username;
          }
        } catch {
          temp[i].usuarioUsername = 'Desconocido';
        }
        try {
          const v = await firstValueFrom(this.viajeservice.getById(r.viajeid));
          if (v) {
            temp[i].viajePartido = v.partido;
          }
        } catch {
          temp[i].viajePartido = 'Desconocido';
        }
      }


      this.todasLasReservas = temp;
      this.totalReservasActivas = reservas.filter(r => r.estado !== 'cancelada').length;
    });
  }

  private cargarResenasConExtra() {
    this.resenasService.getAll().subscribe(async resenas => {
      const temp: ResenaConExtra[] = resenas.map(r => ({
        ...r,
        resenadorUsername: '',
        viajePartido: ''
      }));

      for (let i = 0; i < temp.length; i++) {
        const r = temp[i];
        try {
          const u = await this.userservice.getById(r.userid);
          if (u) {
            temp[i].resenadorUsername = u.username;
          }

        } catch {
          temp[i].resenadorUsername = 'Desconocido';
        }
        try {
          const v = await firstValueFrom(this.viajeservice.getById(r.viajeid));
          temp[i].viajePartido = v.partido;
        } catch {
          temp[i].viajePartido = 'Desconocido';
        }
      }

      this.todasLasResenas = temp;
      this.totalResenas = temp.length;
    });
  }

  eliminarResena(resena: ResenaConExtra) {
    if (!confirm('¿Eliminar esta reseña?')) return;
    this.resenasService.deleteAndUpdateRating(resena.id, resena.usercalificado, resena.calificacion)
      .then(() => {
        this.cargarResenasConExtra();
      })
      .catch(err => console.error('Error al eliminar reseña', err));
  }


  eliminarViaje(id: string) {
    if (!confirm(`¿Estás seguro de que quieres eliminar el viaje  y todo su contenido?`)) {
      return;
    }
    this.viajeservice.deleteWithReservas(id).then(() => {

      this.todosLosViajes = this.todosLosViajes.filter(v => v.id !== id);
      this.todasLasReservas = this.todasLasReservas.filter(r => r.viajeid !== id);
      this.totalReservasActivas = this.todasLasReservas.filter(r => r.estado !== 'cancelada').length;
    })
      .catch(err => console.error('Error eliminando viaje+reservas:', err));
  }

  eliminarUsuario(user: User) {
    this.userservice.delete(user.uid);
    this.usuarios = this.usuarios.filter(u => u.uid !== user.uid);
  }
  async cambiarRol(user: User) {

    let nuevoRol: 'admin' | 'user';

    if (user.rol === 'admin') {
      nuevoRol = 'user';
    } else {
      nuevoRol = 'admin';
    }

    try {
      await this.userservice.updateRol(user.uid, nuevoRol);


      this.usuarios = this.usuarios.map(u => {
        if (u.uid === user.uid) {
          return { ...u, rol: nuevoRol };
        }
        return u;
      });
    } catch (err) {
      console.error('Error al cambiar rol:', err);
      alert('No se pudo cambiar el rol. Intenta de nuevo.');
    }
  }

  eliminarReserva(reservaid: string) {
    this.reservasservice.delete(reservaid);
  }

  eliminarTodoUser(user: User) {
    if (!confirm(`¿Estás seguro de que quieres eliminar al usuario "${user.username}" y todo su contenido?`)) {
      return;
    }

    this.userservice.deleteUserCascade(user.uid)
      .then(() => {
        this.cargarUsuarios();
        this.cargarViajesConExtra();
        this.cargarReservasConExtra();
        this.cargarResenasConExtra();
      })
      .catch(err => {
        console.error('Error eliminando usuario en cascada:', err);
        alert('No se pudo eliminar al usuario. Inténtalo de nuevo más tarde.');
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
