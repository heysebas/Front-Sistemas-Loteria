export type EstadoBillete = 'DISPONIBLE' | 'VENDIDO';

export interface Billete {
  id: number;
  numero: string;
  precio: number;
  estado: EstadoBillete;
  sorteoId: number;
  clienteId?: number | null;

  /** opcional si tu API lo envía */
  sorteoNombre?: string;
}
