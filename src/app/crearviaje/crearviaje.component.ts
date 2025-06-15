import { Component, inject, signal } from '@angular/core';
import { AutenticationService } from '../services/autentication.service';
import { UserService } from '../services/user.service';
import { User } from '../interfaces/user';
import { Viaje } from '../interfaces/viaje';
import { FormBuilder, FormGroup, Validators, FormsModule, FormControl, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { EquiposService } from '../services/equipos.service';
import { MapaComponent } from '../mapa/mapa.component';
import { ViajeService } from '../services/viaje.service';
import { DateTimeValidator } from '../date-time.validator';
@Component({
  selector: 'app-crearviaje',
  imports: [ReactiveFormsModule, FormsModule, CommonModule, RouterModule, MapaComponent],
  templateUrl: './crearviaje.component.html',
  styleUrl: './crearviaje.component.css'
})
export class CrearviajeComponent {

  centerSalida: google.maps.LatLngLiteral = { lat: 40.4168, lng: -3.7038 };
  markersSalida: google.maps.LatLngLiteral[] = [];
  centerLlegada: google.maps.LatLngLiteral = { lat: 40.4168, lng: -3.7038 };
  markersLlegada: google.maps.LatLngLiteral[] = [];
  zoom = 12;
 minDateTime!: string;
 
  private geocoder = new google.maps.Geocoder();

  equipos: string[] = [];
  constructor(private equiposService: EquiposService) {
    this.cargarEquipos();

    this.authService.user$.subscribe(async (user) => {
      if (user) {
        this.usuario = await this.userservice.getById(user.uid);
      } else {
        this.router.navigate(['/inicio']);
      }
    });
    this.setMinDateTime();
  }

  router: Router = inject(Router);
  authService: AutenticationService = inject(AutenticationService);
  userservice: UserService = inject(UserService);
  usuario: User | null = null;
  viaje: Viaje | undefined;
  collapsed = signal(false);
  viajeservice: ViajeService = inject(ViajeService);

  fb = inject(FormBuilder)
  form = this.fb.group({
    equipo1: [''],
    equipo2: [''],
    fecha: ['',[Validators.required,DateTimeValidator.minHoursAhead(3)]],
    precioPorPersona: ['', [Validators.required]],
    plazasDisponibles: ['', [Validators.required]],

    addressSalida: ['', Validators.required],
    addressLlegada: ['', [Validators.required]],
    ciudadSalida: ['', Validators.required],
    lugarSalida: ['', Validators.required],
    latSalida: this.fb.control<number | null>(null, Validators.required),
    lngSalida: this.fb.control<number | null>(null, Validators.required),

    ciudadLlegada: ['', Validators.required],
    lugarLlegada: ['', Validators.required],
    latLlegada: this.fb.control<number | null>(null, Validators.required),
    lngLlegada: this.fb.control<number | null>(null, Validators.required),


  });


  async crearViaje(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      alert('Por favor, completa todos los campos obligatorios.');
      return;
    }

   
    const f = this.form.value;

    var partido = " ";
    if(f.equipo1&&f.equipo2){
        partido = `${f.equipo1} vs ${f.equipo2}`;
    }
    var equipofavorito=this.usuario?.equipofavorito;

   
    const nuevoViaje: Viaje = {
      id: '',  
      partido,
      equipo:equipofavorito!,
      fecha: f.fecha!,                     
      precioPorPersona: Number(f.precioPorPersona!),
      plazasDisponibles: Number(f.plazasDisponibles!),
      organizadorId: this.usuario?.uid ?? '',
      fechaPublicacion: new Date().toISOString(),
      ubicacionSalida: {
        ciudad: f.ciudadSalida!,
        direccion: f.lugarSalida!,
        lat: f.latSalida!,
        lng: f.lngSalida!
      },
      ubicacionLlegada: {
        ciudad: f.ciudadLlegada!,
        direccion: f.lugarLlegada!,
        lat: f.latLlegada!,
        lng: f.lngLlegada!
      },
      inactivo:false
    };

    try {
    
      const docId = await this.viajeservice.save(nuevoViaje);
      alert('¡Viaje creado con éxito!');

     
      this.router.navigate(['/inicio']);
    } catch (e) {
      console.error('Error al crear el viaje:', e);
      alert('Hubo un problema guardando el viaje. Intenta de nuevo.');
    }
  }
  async signOut() {
    try {
      await this.authService.logout();
      location.reload();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  }

  async cargarEquipos() {
    const equiposFirestore = await this.equiposService.getall();
    this.equipos = equiposFirestore.map(e => e.nombre);
  }

  geocodeSalida() {
      const address = this.form.value.addressSalida?.trim();
    if (!address) return alert('Introduce origen');
    this.geocoder.geocode({ address: address, componentRestrictions: { country: 'ES' } })
      .then(res => {
        const r = res.results[0];
        const loc = r.geometry.location.toJSON();
        this.centerSalida = loc;
        this.markersSalida = [loc];
        this.form.patchValue({
          ciudadSalida: r.address_components.find(c => c.types.includes('locality'))?.long_name ?? '',
          lugarSalida: r.formatted_address,
          latSalida: loc.lat,
          lngSalida: loc.lng
        });
      })
      .catch(() => alert('Origen no encontrado'));
  }
  geocodeLlegada() {
    const address = this.form.value.addressLlegada?.trim();
    if (!address) return alert('Introduce destino');
    this.geocoder.geocode({ address: address, componentRestrictions: { country: 'ES' } })
      .then(res => {
        const r = res.results[0];
        const loc = r.geometry.location.toJSON();
        this.centerLlegada = loc;
        this.markersLlegada = [loc];
        this.form.patchValue({
          ciudadLlegada: r.address_components.find(c => c.types.includes('locality'))?.long_name ?? '',
          lugarLlegada: r.formatted_address,
          latLlegada: loc.lat,
          lngLlegada: loc.lng
        });
      })
      .catch(() => alert('Destino no encontrado'));
  }

clearSalida() {
  this.markersSalida = [];
  this.form.patchValue({
    addressSalida: '',
    ciudadSalida:  '',
    lugarSalida:   '',
    latSalida:     null,
    lngSalida:     null
  });
}

  clearLlegada() {
    this.markersLlegada = [];
    this.form.patchValue({
      ciudadLlegada: '',
      lugarLlegada: '',
      latLlegada: null,
      lngLlegada: null
    });
  }

  private extractComponent(components: google.maps.GeocoderAddressComponent[], type: string): string | null {
    const comp = components.find(c => c.types.includes(type));
    return comp ? comp.long_name : null;
  }

  inicio(){
      this.router.navigate(['/inicio']);
  }


   private setMinDateTime() {
    const now = new Date();
    now.setHours(now.getHours() + 3);

    // formatea con ceros a izquierda
    const pad = (n: number) => n.toString().padStart(2, '0');
    const year   = now.getFullYear();
    const month  = pad(now.getMonth() + 1);
    const day    = pad(now.getDate());
    const hour   = pad(now.getHours());
    const minute = pad(now.getMinutes());

    this.minDateTime = `${year}-${month}-${day}T${hour}:${minute}`;
  }

}

