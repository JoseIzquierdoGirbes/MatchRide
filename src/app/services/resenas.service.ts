import { Injectable } from '@angular/core';
import { Reserva } from '../interfaces/reserva';
import { initializeApp } from "firebase/app";
import { collection, deleteDoc, getDoc, getDocs, getFirestore, query, updateDoc, where } from "firebase/firestore";
import { environment } from "../../enviroments/enviroments";
import { doc, setDoc } from "firebase/firestore";
import { Observable } from 'rxjs';
import { collectionData } from '@angular/fire/firestore';
import { Resena } from '../interfaces/resena';
import { User } from '../interfaces/user';
@Injectable({
  providedIn: 'root'
})
export class ResenasService {

  constructor() { }
  app = initializeApp(environment.firebase);
  db = getFirestore(this.app);


  async save(resena: Resena) {
    const resenaref = doc(collection(this.db, "resenas"));
    resena.id = resenaref.id;
    await setDoc(resenaref, resena);
    return resena.id
  }

  getAll(): Observable<Resena[]> {
    const resenasssCol = collection(this.db, 'resenas');
    return collectionData(resenasssCol, { idField: 'id' }) as Observable<Resena[]>;
  }

  getByUsuarioCalidficado(usuarioId: string): Observable<Resena[]> {
    const resenasCol = collection(this.db, 'resenas');
    const q = query(resenasCol, where('usercalificado', '==', usuarioId));
    return collectionData(q, { idField: 'id' }) as Observable<Resena[]>;
  }

  getByViaje(viajeId: string): Observable<Resena[]> {
    const resenasCol = collection(this.db, 'resenas');
    const q = query(resenasCol, where('viajeid', '==', viajeId));
    return collectionData(q, { idField: 'id' }) as Observable<Resena[]>;
  }

  async existeResena(usuarioId: string, viajeId: string): Promise<boolean> {
    const resenasCol = collection(this.db, 'resenas');
    const q = query(
      resenasCol,
      where('userid', '==', usuarioId),
      where('viajeid', '==', viajeId)
    );
    const snapshot = await getDocs(q);
    return !snapshot.empty;
  }

  async updateUserAverageRating(userId: string, nuevaPuntuacion: number): Promise<void> {
    const userRef = doc(this.db, "users", userId);
    const userSnap = await getDoc(userRef);

    const usuario = userSnap.data() as User;

    const promedioViejo = usuario.calificacionPromedio ?? 0;
    const countViejo = usuario.numresenas ?? 0;

    const countNuevo = countViejo + 1;
    const promedioNuevo = (promedioViejo * countViejo + nuevaPuntuacion) / countNuevo;


    await updateDoc(userRef, {
      calificacionPromedio: promedioNuevo,
      numresenas: countNuevo
    });
  }

  delete(id: string): Promise<void> {
    const ref = doc(this.db, 'resenas', id);
    return deleteDoc(ref);
  }


  async deleteAndUpdateRating(resenaId: string,userCalificado: string, puntuacionEliminada: number): Promise<void> {
    await deleteDoc(doc(this.db, 'resenas', resenaId));

    const userRef = doc(this.db, 'users', userCalificado);
    const snap = await getDoc(userRef);
    if (!snap.exists()) throw new Error('Usuario no encontrado');

    const data = snap.data() as {
      calificacionPromedio?: number;
      numresenas?: number;
    };
    const promedioViejo = data.calificacionPromedio ?? 0;
    const countViejo = data.numresenas ?? 0;

   
    const countNuevo = Math.max(0, countViejo - 1);
    let promedioNuevo = 0;
    if (countNuevo > 0) {
      promedioNuevo = (promedioViejo * countViejo - puntuacionEliminada) / countNuevo;
    }

    await updateDoc(userRef, {
      numresenas: countNuevo,
      calificacionPromedio: promedioNuevo
    });
  }


async updateUserRating(userId: string): Promise<void> {
  const userRef = doc(this.db, 'users', userId);
  const snap     = await getDoc(userRef);
  if (!snap.exists()) return;

  
  const col = collection(this.db, 'resenas');
  const q   = query(col, where('usercalificado','==', userId));
  const snap2 = await getDocs(q);

  
  const countN = snap2.size;
  let avgN = 0;
  if (countN > 0) {
    let sum = 0;
    snap2.docs.forEach(d => {
      
      const r = d.data() as Resena;
      sum += (r.calificacion || 0);
    });
    avgN = Math.round((sum / countN) * 10) / 10;
  }

  
  await updateDoc(userRef, { 
    numresenas: countN,
    calificacionPromedio: avgN
  });
}


}






