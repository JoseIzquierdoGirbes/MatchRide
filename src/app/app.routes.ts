import { Routes } from '@angular/router';
import { RegisterComponent } from './register/register.component';
import { LoginComponent } from './login/login.component';
import { CrearusuarioComponent } from './crearusuario/crearusuario.component';
import { IncicioComponent } from './incicio/incicio.component';
import { ResetpasswordComponent } from './resetpassword/resetpassword.component';
import { PerfilComponent } from './perfil/perfil.component';
import { CrearviajeComponent } from './crearviaje/crearviaje.component';
import { ViajespublicadosComponent } from './viajespublicados/viajespublicados.component';
import { ReservasComponent } from './reservas/reservas.component';
import { AdminComponent } from './admin/admin.component';


export const routes: Routes = [
  { 
    path: '', 
    redirectTo: '/inicio', 
    pathMatch: 'full' 
  },
  {
      path: 'register',
      component: RegisterComponent,
      title: 'Register'
    },
    {
      path: 'login',
      component: LoginComponent,
      title: 'Login'
    },
    { 
      path: 'crearusuario', 
      component: CrearusuarioComponent, 
      pathMatch: 'full' 
    },
    { 
      path: 'inicio', 
      component: IncicioComponent, 
      pathMatch: 'full' 
    },
    { 
      path: 'resetpassword', 
      component: ResetpasswordComponent, 
      pathMatch: 'full' 
    },
    { 
      path: 'perfil', 
      component: PerfilComponent, 
      pathMatch: 'full' 
    },
    {
      path:'crearviaje',
      component: CrearviajeComponent, 
      pathMatch: 'full'
    },
      {
      path:'viajespublicados',
      component: ViajespublicadosComponent, 
      pathMatch: 'full'
    },
      {
      path:'reservas',
      component: ReservasComponent, 
      pathMatch: 'full'
    },
      {
      path:'admin',
      component: AdminComponent, 
      pathMatch: 'full'
    }
  
];
