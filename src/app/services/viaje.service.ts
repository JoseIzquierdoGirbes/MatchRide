
import { collectionData} from '@angular/fire/firestore';
import { Injectable, inject } from '@angular/core';
import { initializeApp } from 'firebase/app';
import {
  collection,
  doc,
  getFirestore,
  setDoc,
  DocumentReference,
  writeBatch,
  deleteDoc,
  query,
  where,
  getDocs
} from 'firebase/firestore';
import { docData } from '@angular/fire/firestore';
import { ReservaService } from './reserva.service';
import { Viaje } from '../interfaces/viaje';

import {
  forkJoin,
  of,
  Observable,
  switchMap,
  map,
  catchError
} from 'rxjs';
import { environment } from '../../enviroments/enviroments';


@Injectable({
  providedIn: 'root'
})
export class ViajeService {
  reservaservice: ReservaService = inject(ReservaService);
  constructor() { }
  app = initializeApp(environment.firebase);
  db = getFirestore(this.app);
  
  viajes:Viaje[]=[];
  
    async save(viaje: Viaje) {
      const viajeref = doc(collection(this.db, "viajes"));
      viaje.id = viajeref.id;
      await setDoc(viajeref, viaje);
      return viajeref.id
    }

    getAll(): Observable<Viaje[]> {
    const viajesCol = collection(this.db, 'viajes');
    return collectionData(viajesCol, { idField: 'id' }) as Observable<Viaje[]>;
  }

   getById(id: string): Observable<Viaje> {
    const viajeDoc = doc(this.db, 'viajes', id);
    return docData(viajeDoc, { idField: 'id' }) as Observable<Viaje>;
  }

   async markInactive(ids: string[]): Promise<void> {
    if (ids.length === 0) return;
    const batch = writeBatch(this.db);
    for (const id of ids) {
      const ref = doc(this.db, 'viajes', id);
      batch.update(ref, { inactivo: true });
    }
    await batch.commit();
  }

  delete(id: string): Promise<void> {
    const ref = doc(this.db, 'viajes', id);
    return deleteDoc(ref);
  }

  async deleteWithReservas(id: string): Promise<void> {
    const batch = writeBatch(this.db);

    const viajeRef = doc(this.db, 'viajes', id);
    batch.delete(viajeRef);

    const reservasCol = collection(this.db, 'reservas');
    const q = query(reservasCol, where('viajeid', '==', id));
    const snapshot = await getDocs(q);

    snapshot.forEach(resDoc => {
      batch.delete(resDoc.ref);
    });

    await batch.commit();
  }
  
}
