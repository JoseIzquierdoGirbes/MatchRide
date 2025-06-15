import { Component, inject, OnInit } from '@angular/core';
import { AutenticationService } from '../services/autentication.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, FormsModule, FormControl, ReactiveFormsModule } from '@angular/forms';
import { UserService } from '../services/user.service';
import { checkPasswords } from '../ValidatorPassword.validator';
import { User } from '../interfaces/user';
import { EquiposService } from '../services/equipos.service';
@Component({
  selector: 'app-perfil',
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './perfil.component.html',
  styleUrl: './perfil.component.css'
})
export class PerfilComponent {
  usuario: User | null = null;
  fb = inject(FormBuilder)
  router: Router = inject(Router);
  authService: AutenticationService = inject(AutenticationService);
  userService: UserService = inject(UserService);
  usernameExiste: boolean = false;
  emailExiste: boolean = false;
  equipos: string[] = [];
  url='';

  form = this.fb.group({
    username: ['', [Validators.required, Validators.minLength(4)]],
    equipofavorito: ['', [Validators.required]],
    fotoperfil: []
  });

  constructor(private equiposService: EquiposService) {
    this.cargarEquipos();
    this.authService.user$.subscribe(async (user) => {
      if (user) {
        this.usuario = await this.userService.getById(user.uid);
        this.form.patchValue({
          username: this.usuario?.username ?? '',
          equipofavorito: this.usuario?.equipofavorito ?? ''
        });
      }
    });
    this.form.controls.username.valueChanges.subscribe(() => {
      this.usernameExiste = false;
    });

  }



   async guardar() {
   
    if (!this.form.valid) {
      this.form.markAllAsTouched();
      return;
    } else {
      const formValues = this.form.value;
      if(!this.url){
        this.url=this.usuario?.fotoPerfil as string;
      }
      const usuarioactualizado: User = {
        uid: this.usuario?.uid as string,
        username: formValues.username as string,
        email: this.usuario?.email as string,
        fotoPerfil: this.url,
        numresenas:this.usuario?.numresenas as number,
        equipofavorito: formValues.equipofavorito as string,
        calificacionPromedio: this.usuario?.calificacionPromedio as number,
        rol: this.usuario?.rol as string
      };

      const usuarios = await this.userService.getall();
      this.usernameExiste = false;
      if (usuarioactualizado.username != this.usuario?.username) {
        for (const u of usuarios) {
          if (u.username == usuarioactualizado.username) {
            this.usernameExiste = true;
            break;
          }
        }
      }

      if (!this.usernameExiste) {
        this.userService.save(usuarioactualizado).then(() => {
          this.router.navigate(['/inicio']);
        }).catch(err => {
          console.error('Error al guardar usuario:', err);
        });
      }

    

    }
      
    
  }

  async uploadFile(event: any) {
    const input = event.target as HTMLInputElement;
    const archivoSeleccionado = event.target.files[0];
    this.userService.subirfotoperfil(archivoSeleccionado).then((url) => {
      if (this.usuario) {
        this.usuario.fotoPerfil = url;
      }
    }).catch((error) => {
      console.error('Error al subir la imagen:', error);
    });
  }
  async cargarEquipos() {
    const equiposFirestore = await this.equiposService.getall();
    this.equipos = equiposFirestore.map(e => e.nombre);
  }
}
