// ============================================================
// Archivo: src/app/models/sorteo.ts
// Descripción:
// Define la interfaz que representa la estructura de un sorteo
// dentro del sistema de lotería. Este modelo se utiliza tanto
// para mostrar la información en el frontend como para las
// operaciones de comunicación con el backend (API REST).
// ============================================================

/**
 * Representa un sorteo del sistema de lotería.
 *
 * Campos:
 * - id: Identificador único del sorteo.
 * - nombre: Nombre descriptivo del sorteo (por ejemplo, "Sorteo de Navidad").
 * - fechaSorteo: Fecha programada para la realización del sorteo (en formato ISO string o 'yyyy-MM-dd').
 * - totalBilletes: Cantidad total de billetes generados para este sorteo.
 */
export interface Sorteo {
  /** Identificador único del sorteo. */
  id: number;

  /** Nombre del sorteo (ejemplo: "Sorteo de Año Nuevo"). */
  nombre: string;

  /** Fecha en la que se llevará a cabo el sorteo. */
  fechaSorteo: string;

  /** Número total de billetes emitidos para el sorteo. */
  totalBilletes: number;
}
