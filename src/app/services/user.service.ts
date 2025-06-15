import { Injectable } from '@angular/core';
import { inject } from '@angular/core';
import { User } from '../interfaces/user';
import { initializeApp } from "firebase/app";
import { collection, deleteDoc, getDocs, getFirestore, query, updateDoc, where, writeBatch } from "firebase/firestore";
import { environment } from "../../enviroments/enviroments";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL, uploadBytesResumable } from 'firebase/storage';
import { Observable } from 'rxjs';
import { collectionData } from '@angular/fire/firestore';
import { ResenasService } from './resenas.service';
import { Resena } from '../interfaces/resena';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  app = initializeApp(environment.firebase);
  db = getFirestore(this.app);
  storage = getStorage(this.app);

  usuarios: User[] = [];

constructor(private resenasService: ResenasService){}

  async subirfotoperfil(file: File) {
    const filePath = `fotos_perfil/${file.name}`;
    const fileRef = ref(this.storage, filePath);

    await uploadBytes(fileRef, file);
    const url = await getDownloadURL(fileRef);
    return url;
  }
  async save(user: User) {
    await setDoc(doc(this.db, "users", user.uid), user);
  }

  async getall() {
    const querySnapshot = await getDocs(collection(this.db, "users"));
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      this.usuarios.push(data as User);
    });
    return this.usuarios;
  }

  getAll(): Observable<User[]> {
    const usersCol = collection(this.db, 'users');
    return collectionData(usersCol, { idField: 'id' }) as Observable<User[]>;
  }

  async getById(uid: string): Promise<User | null> {
    const userRef = doc(this.db, "users", uid);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      return userSnap.data() as User;
    } else {
      return null;
    }
  }

  delete(id: string): Promise<void> {
    const ref = doc(this.db, 'users', id);
    return deleteDoc(ref);
  }

  async updateRol(uid: string, nuevoRol: 'admin' | 'user'): Promise<void> {
    const userRef = doc(this.db, `users/${uid}`);
    await updateDoc(userRef, { rol: nuevoRol });
  }

  async deleteUserCascade2(uid: string): Promise<void> {
    // 1) Crear el batch
    const batch = writeBatch(this.db);

    // 2) Borrar todos los viajes que organizaba este usuario + sus reservas
    const viajesCol = collection(this.db, 'viajes');
    const qViajes = query(viajesCol, where('organizadorId', '==', uid));
    const snapshotViajes = await getDocs(qViajes);

    for (const viajeDoc of snapshotViajes.docs) {
      const viajeId = viajeDoc.id;

      // 2.a) Marca el viaje para borrado
      batch.delete(viajeDoc.ref);

      // 2.b) Busca todas las reservas que tengan viajeid == viajeId
      const reservasCol = collection(this.db, 'reservas');
      const qResPorViaje = query(reservasCol, where('viajeid', '==', viajeId));
      const snapshotResPorViaje = await getDocs(qResPorViaje);

      // 2.c) Marca cada reserva encontrada para borrado
      for (const resDoc of snapshotResPorViaje.docs) {
        batch.delete(resDoc.ref);
      }
    }

    // 3) Borrar todas las reservas donde usuarioid == uid (sus propias reservas)
    const reservasCol2 = collection(this.db, 'reservas');
    const qResPorUsuario = query(reservasCol2, where('usuarioid', '==', uid));
    const snapshotResPorUsuario = await getDocs(qResPorUsuario);

    for (const resDoc of snapshotResPorUsuario.docs) {
      batch.delete(resDoc.ref);
    }


    

    // 4) Finalmente, borrar el documento del usuario en /users/{uid}
    const userRef = doc(this.db, `users/${uid}`);
    batch.delete(userRef);

    // 5) Ejecutar el batch para que realmente se eliminen todos los documentos
    await batch.commit();
  }



  async deleteUserCascade(uid: string): Promise<void> {
  // 1) Recoger IDs de usuarios a los que él reseñó
  const colResByUser = collection(this.db, 'resenas');
  const qResByUser  = query(colResByUser, where('userid', '==', uid));
  const snapResByUser = await getDocs(qResByUser);

  // Usamos Set<string> para los IDs únicos
  const afectados = new Set<string>();
  snapResByUser.docs.forEach(d => {
    const data = d.data() as any;
    if (data.usercalificado) {
      afectados.add(data.usercalificado);
    }
  });

  // 2) Preparamos el batch
  const batch = writeBatch(this.db);

  // 2.a) Borrar viajes y sus reservas
  const colViajes = collection(this.db, 'viajes');
  const qViajes   = query(colViajes, where('organizadorId', '==', uid));
  const snapViajes = await getDocs(qViajes);
  for (const vdoc of snapViajes.docs) {
    batch.delete(vdoc.ref);
    const viajeId = vdoc.id;
    const colResViaje = collection(this.db, 'reservas');
    const qResViaje   = query(colResViaje, where('viajeid','==',viajeId));
    const snapResViaje= await getDocs(qResViaje);
    snapResViaje.docs.forEach(rdoc => batch.delete(rdoc.ref));
  }

  // 2.b) Borrar reservas propias
  const colResOwn = collection(this.db, 'reservas');
  const qResOwn   = query(colResOwn, where('usuarioid','==',uid));
  const snapResOwn= await getDocs(qResOwn);
  snapResOwn.docs.forEach(rdoc => batch.delete(rdoc.ref));

  // 2.c) Borrar reseñas escritas por él
  snapResByUser.docs.forEach(rdoc => batch.delete(rdoc.ref));

  // 2.d) Borrar reseñas dirigidas a él
  const qResToUser = query(colResByUser, where('usercalificado','==',uid));
  const snapResToUser = await getDocs(qResToUser);
  snapResToUser.docs.forEach(rdoc => batch.delete(rdoc.ref));

  // 2.e) Borrar al propio usuario
  batch.delete(doc(this.db, 'users', uid));

  // 3) Ejecutar el batch
  await batch.commit();

  // 4) Para cada usuario calificado, recálcula su media de reseñas
  for (const calificadoId of afectados) {
    await this.resenasService.updateUserRating(calificadoId);
  }
}
}

