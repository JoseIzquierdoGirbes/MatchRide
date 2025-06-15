import { Injectable } from '@angular/core';
import { inject } from '@angular/core';
import { Reserva } from '../interfaces/reserva';
import { initializeApp } from "firebase/app";
import { collection, deleteDoc, getDocs, getFirestore, increment, query, updateDoc, where, writeBatch } from "firebase/firestore";
import { environment } from "../../enviroments/enviroments";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { Observable } from 'rxjs';
import { collectionData } from '@angular/fire/firestore';

@Injectable({
  providedIn: 'root'
})
export class ReservaService {

  constructor() { }
  app = initializeApp(environment.firebase);
  db = getFirestore(this.app);

  reservas: Reserva[] = [];

  async save(reserva: Reserva) {
    const reservaref = doc(collection(this.db, "reservas"));
    reserva.id = reservaref.id;
    await setDoc(reservaref, reserva);
    return reservaref.id
  }

  getAll(): Observable<Reserva[]> {
    const reservassCol = collection(this.db, 'reservas');
    return collectionData(reservassCol, { idField: 'id' }) as Observable<Reserva[]>;
  }

  getByUsuario(usuarioId: string): Observable<Reserva[]> {
    const reservasCol = collection(this.db, 'reservas');
    const q = query(reservasCol, where('usuarioid', '==', usuarioId));
    return collectionData(q, { idField: 'id' }) as Observable<Reserva[]>;
  }

  getByViaje(viajeId: string): Observable<Reserva[]> {
    const reservasCol = collection(this.db, 'reservas');
    const q = query(reservasCol, where('viajeid', '==', viajeId));
    return collectionData(q, { idField: 'id' }) as Observable<Reserva[]>;
  }

  async aceptarReserva(reserva: Reserva) {
    const batch = writeBatch(this.db);

    
    const reservaRef = doc(this.db, `reservas/${reserva.id}`);
    batch.update(reservaRef, { estado: 'aceptada' });

    
    const viajeRef = doc(this.db, `viajes/${reserva.viajeid}`);
    batch.update(viajeRef, {
      plazasDisponibles: increment(-1)
    });

    
    await batch.commit();
  }

  rechazarReserva(reserva: Reserva) {
    const ref = doc(this.db, `reservas/${reserva.id}`);
    return updateDoc(ref, { estado: 'cancelada' });
  }


  async cancelarReserva(reserva: Reserva): Promise<void> {
    const batch = writeBatch(this.db);

    
    const reservaRef = doc(this.db, `reservas/${reserva.id}`);
    batch.update(reservaRef, { estado: 'cancelada' });

    
    const viajeRef = doc(this.db, `viajes/${reserva.viajeid}`);
    batch.update(viajeRef, {
      plazasDisponibles: increment(1)
    });

    
    await batch.commit();
  }

   delete(id: string): Promise<void> {
      const ref = doc(this.db, 'reservas', id);
      return deleteDoc(ref);
    }
}
