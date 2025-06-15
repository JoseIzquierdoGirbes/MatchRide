import { Injectable } from '@angular/core';
import { Equipo } from '../interfaces/equipos';
import { initializeApp } from 'firebase/app';
import { environment } from '../../enviroments/enviroments';
import { collection, doc, getDocs, getFirestore, setDoc } from 'firebase/firestore';

@Injectable({
  providedIn: 'root'
})
export class EquiposService {

  constructor() { }
   equipos: Equipo[] = [];

  
   app = initializeApp(environment.firebase);
   db = getFirestore(this.app);
  
  
  async getall(){
    const querySnapshot = await getDocs(collection(this.db, "equipos"));
    querySnapshot.forEach((doc) => {
    const data= doc.data();
    this.equipos.push(data as Equipo);
    });
    return this.equipos;
   }
    
  
  
  
}
