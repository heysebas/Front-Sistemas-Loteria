export interface Sorteo {
  id: number;
  nombre: string;
  /** ISO string o fecha; el pipe |date funciona con ambos */
  fechaSorteo: string;
}
