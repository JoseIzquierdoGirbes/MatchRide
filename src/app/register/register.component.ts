import { Component, inject,OnInit  } from '@angular/core';
import { AutenticationService } from '../services/autentication.service';
import { Router } from '@angular/router';
import {  CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators,FormsModule, FormControl,ReactiveFormsModule } from '@angular/forms';
import { UserService } from '../services/user.service';
import { checkPasswords } from '../ValidatorPassword.validator';


@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule,CommonModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent  {
  fb=inject(FormBuilder)
  router: Router = inject(Router);
  authService: AutenticationService = inject(AutenticationService);
  userService:UserService = inject(UserService);
  emailExiste :boolean= false;
    form = this.fb.group({
      email:['',[Validators.required,Validators.pattern('^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.(com|es)$')]],
      contrasena: ['',[Validators.required,Validators.pattern('^(?=.*[A-Z])(?=.*[^a-zA-Z0-9]).{6,}$')]],
      confcontrasena: ['',Validators.required],
     
    },
    { validators: checkPasswords }    
  );
  

  async registrarse() {
    if(!this.form.valid){
      this.form.markAllAsTouched();
    }else{
      this.emailExiste=false;

      this.authService.register(
      this.form.get('email')?.value as string,
      this.form.get('confcontrasena')?.value as string).subscribe({
        next: () => {
          this.router.navigate(['/crearusuario']); 
        },
        error: (err) => {
          console.error('Error en el registro:', err);
          if (err.code === 'auth/email-already-in-use') {
            this.emailExiste = true;
          }
        }
      });
    }
    
    
   
  }

   
}
