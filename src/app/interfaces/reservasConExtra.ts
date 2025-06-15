import { Reserva } from "./reserva";

export interface ReservaConExtra extends Reserva {
  usuarioUsername: string;
  viajePartido: string;
}