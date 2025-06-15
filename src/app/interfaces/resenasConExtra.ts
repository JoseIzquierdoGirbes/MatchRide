import { Resena } from "./resena";

export interface ResenaConExtra extends Resena {
  resenadorUsername: string;
  viajePartido:string;
}