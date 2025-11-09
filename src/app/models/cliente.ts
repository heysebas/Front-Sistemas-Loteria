// ============================================================
// Archivo: src/app/models/cliente.ts
// Descripción:
// Define la interfaz que representa a un cliente del sistema de
// lotería. Este modelo se utiliza en todo el frontend para
// registrar, listar o consultar información de los clientes.
// ============================================================

/**
 * Representa a un cliente dentro del sistema de lotería.
 *
 * Campos:
 * - id: Identificador único del cliente.
 * - nombre: Nombre completo del cliente.
 * - correo: Dirección de correo electrónico asociada al cliente.
 */
export interface Cliente {
  /** Identificador único del cliente. */
  id: number;

  /** Nombre completo del cliente. */
  nombre: string;

  /** Correo electrónico del cliente. */
  correo: string;
}
