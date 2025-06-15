import { Component, inject,OnInit  } from '@angular/core';
import { FormBuilder, FormGroup, Validators,FormsModule, FormControl,ReactiveFormsModule } from '@angular/forms';
import { AutenticationService } from '../services/autentication.service';
import { Router,RouterModule } from '@angular/router';
import { AsyncPipe, CommonModule } from '@angular/common';
import { UserService } from '../services/user.service';
import { firstValueFrom } from 'rxjs';
@Component({
  selector: 'app-login',
  imports: [FormsModule,AsyncPipe,ReactiveFormsModule, CommonModule,RouterModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  error: boolean = false;
  
  authService: AutenticationService = inject(AutenticationService);
  user$ = this.authService.user$;  
  router: Router = inject(Router);
  fb=inject(FormBuilder);
  userService:UserService = inject(UserService);
  errorinicioSesion:boolean=false;
  textoerror="";

form = this.fb.group({
      email:['',[Validators.required,Validators.email]],
      password: ['',[Validators.required]]
    },  
  );

  onSubmit(): void {
    if(!this.form.valid){
      this.form.markAllAsTouched();
    }else{

      this.authService.login(this.form.get('email')?.value as string, this.form.get('password')?.value as string,).subscribe({
        next: () => {
         this.router.navigateByUrl('/inicio');
        },
        error: async (error) => {
          const usuarios = await this.userService.getall();
          const emailActual = this.form.get('email')?.value as string;
          var registrado=false;
          this.errorinicioSesion = true;
          for (const u of  usuarios) {
            if (u.email === emailActual) {
              registrado=true;
            }
            if(registrado){
              this.error = true;
              console.error('Email/Password Sign-In error:', error);
              if (error.code === 'auth/invalid-credential') {
                this.textoerror="email o contraseña incorrectos";
              
              }
            }else{
              this.textoerror="email no registrado";
            }
          }
  
        },
      });
    }

  }

  async onGoogleSignIn(): Promise<void> {
    try {
      await this.authService.googleLogin();
      const usuarios = await this.userService.getall();
      const currentUser = await firstValueFrom(this.user$); // obtiene el usuario actual una sola vez
      const emailActual = currentUser?.email;
      var registrado=false;
      for (const u of  usuarios) {
        if (u.email === emailActual) {
          registrado=true;
        }
        if(registrado){
          this.router.navigateByUrl('/inicio');
        }else{
          this.router.navigateByUrl('/crearusuario');
        }
      }


      
    } catch (error) {
      console.error('Google Sign-In error:', error);
    }
  }

  async signOut() {
    try {
      await this.authService.logout();
      this.router.navigateByUrl('/');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  }

}
