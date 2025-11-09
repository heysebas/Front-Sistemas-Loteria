// ============================================================
// Archivo: src/app/models/billete.ts
// Descripción:
// Define la interfaz y el tipo enumerado que representan a un
// billete dentro del sistema de lotería. Este modelo incluye
// información sobre su número, precio, estado, sorteo asociado
// y cliente comprador (si aplica).
// ============================================================

/**
 * Posibles estados de un billete.
 * - DISPONIBLE: el billete aún no ha sido vendido.
 * - VENDIDO: el billete ya fue adquirido por un cliente.
 */
export type EstadoBillete = 'DISPONIBLE' | 'VENDIDO';

/**
 * Representa un billete emitido dentro de un sorteo.
 *
 * Campos:
 * - id: Identificador único del billete.
 * - numero: Número del billete (numérico para permitir orden y comparación).
 * - precio: Valor de venta del billete.
 * - estado: Estado actual del billete ("DISPONIBLE" o "VENDIDO").
 * - sorteoId: Identificador del sorteo al que pertenece.
 * - clienteId: Identificador del cliente comprador (si el billete fue vendido).
 * - sorteoNombre: Campo opcional con el nombre del sorteo (si el backend lo incluye).
 */
export interface Billete {
  /** Identificador único del billete. */
  id: number;

  /** Número del billete (tipo number para facilitar ordenamiento). */
  numero: number;

  /** Precio del billete. */
  precio: number;

  /** Estado actual del billete. */
  estado: EstadoBillete;

  /** ID del sorteo al que pertenece el billete. */
  sorteoId: number;

  /** ID del cliente que compró el billete (si aplica). */
  clienteId?: number | null;

  /** Nombre del sorteo, solo si el backend lo envía. */
  sorteoNombre?: string;
}
