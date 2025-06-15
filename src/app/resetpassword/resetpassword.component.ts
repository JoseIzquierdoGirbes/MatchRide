import { Component, inject,OnInit  } from '@angular/core';
import { AutenticationService } from '../services/autentication.service';
import { Router } from '@angular/router';
import {  CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators,FormsModule, FormControl,ReactiveFormsModule } from '@angular/forms';
import { UserService } from '../services/user.service';
import { checkPasswords } from '../ValidatorPassword.validator';
@Component({
  selector: 'app-resetpassword',
  imports: [ReactiveFormsModule,CommonModule],
  templateUrl: './resetpassword.component.html',
  styleUrl: './resetpassword.component.css'
})
export class ResetpasswordComponent {

  fb=inject(FormBuilder)
  router: Router = inject(Router);
  authService: AutenticationService = inject(AutenticationService);
  userService:UserService = inject(UserService);
  emailExiste :boolean= false;
    form = this.fb.group({
      email:['',[Validators.required,Validators.email]]
    },);

    async guardar(){
      if(!this.form.valid){
        this.form.markAllAsTouched();
      }else{
        this.emailExiste=false;

      this.authService.resetPassword(
      this.form.get('email')?.value as string).subscribe({
        next: () => {
          this.router.navigate(['/login']); 
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
