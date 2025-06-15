export interface Viaje {
    id:string
    equipo:string
    partido: string;                
    fecha: string;                                      
    precioPorPersona: number;      
    plazasDisponibles: number;     
    organizadorId: string;       
    fechaPublicacion: string; 
    ubicacionSalida: {
      ciudad:string;
      direccion:string;
      lat: number;
      lng: number;
    };
    ubicacionLlegada: {
      ciudad:string;
      direccion:string;
      lat: number;
      lng: number;
    };
    inactivo:boolean;
  }