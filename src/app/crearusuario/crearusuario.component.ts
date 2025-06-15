import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, FormsModule, FormControl, ReactiveFormsModule } from '@angular/forms';
import { User } from '../interfaces/user';
import { AutenticationService } from '../services/autentication.service';
import { UserService } from '../services/user.service';
import { user } from '@angular/fire/auth';
import { EquiposService } from '../services/equipos.service';

@Component({
  selector: 'app-crearusuario',
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './crearusuario.component.html',
  styleUrl: './crearusuario.component.css'
})
export class CrearusuarioComponent {

  constructor(private equiposService: EquiposService) {
    this.cargarEquipos();
    this.form.controls.username.valueChanges.subscribe(() => {
      this.usernameExiste = false;
    });
  }
  
  authService: AutenticationService = inject(AutenticationService);
  userService: UserService = inject(UserService);
  
  currentuser = this.authService.user$;
  usuario: User | undefined;
  usernameExiste: boolean = false;
  equipos: string[] = [];
  archivoSeleccionado:File | undefined;

   fb= inject(FormBuilder)
  router: Router = inject(Router);

  form = this.fb.group({
    username: ['', [Validators.required, Validators.minLength(4)]],
    equipofavorito: ['', [Validators.required]],
    fotoperfil:[]
  },
  );
  

  guardar() {

    if (!this.form.valid) {
      this.form.markAllAsTouched();
      return;
    } else {
      this.currentuser.subscribe(async user => {
        if (!user) return;

        const formValues = this.form.value;
        let url = "https://firebasestorage.googleapis.com/v0/b/matchride-e8ba4.firebasestorage.app/o/fotos_perfil%2Fpordefecto.png?alt=media&token=a751c5f8-4f9d-4984-9760-a3857a0b85ab";
        if(this.archivoSeleccionado){
          url = await this.userService.subirfotoperfil(this.archivoSeleccionado);
        }
       
        const usuario: User = {
          uid: user.uid,
          username: formValues.username as string,
          rol:"user",
          email: user.email ?? '',
          fotoPerfil: url,
          numresenas:0,
          equipofavorito: formValues.equipofavorito as string,
          calificacionPromedio: 0
        };
        const usuarios = await this.userService.getall();
        this.usernameExiste = false;

        for (const u of usuarios) {
          console.log(u, usuario.username);
          if (u.username == usuario.username) {
            this.usernameExiste = true;
            break;
          }
        }

        if (!this.usernameExiste) {
          console.log("es correcto");
          this.userService.save(usuario).then(() => {
            console.log('Usuario guardado exitosamente');
            this.router.navigate(['/inicio']);
          }).catch(err => {
            console.error('Error al guardar usuario:', err);
          });
        }

      });
    }
  }

 

  uploadFile(event: any) {
    const input = event.target as HTMLInputElement;
    this.archivoSeleccionado =event.target.files[0];
    console.log(this.archivoSeleccionado);
  }

  async cargarEquipos() {
    const equiposFirestore = await this.equiposService.getall();
    this.equipos = equiposFirestore.map(e => e.nombre);
  }
}
