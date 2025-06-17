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


  async deleteUserCascade(uid: string): Promise<void> {

  const colResByUser = collection(this.db, 'resenas');
  const qResByUser  = query(colResByUser, where('userid', '==', uid));
  const snapResByUser = await getDocs(qResByUser);


  const afectados = new Set<string>();
  snapResByUser.docs.forEach(d => {
    const data = d.data() as any;
    if (data.usercalificado) {
      afectados.add(data.usercalificado);
    }
  });


  const batch = writeBatch(this.db);


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


  const colResOwn = collection(this.db, 'reservas');
  const qResOwn   = query(colResOwn, where('usuarioid','==',uid));
  const snapResOwn= await getDocs(qResOwn);
  snapResOwn.docs.forEach(rdoc => batch.delete(rdoc.ref));


  snapResByUser.docs.forEach(rdoc => batch.delete(rdoc.ref));


  const qResToUser = query(colResByUser, where('usercalificado','==',uid));
  const snapResToUser = await getDocs(qResToUser);
  snapResToUser.docs.forEach(rdoc => batch.delete(rdoc.ref));


  batch.delete(doc(this.db, 'users', uid));

 
  await batch.commit();


  for (const calificadoId of afectados) {
    await this.resenasService.updateUserRating(calificadoId);
  }
}

}

