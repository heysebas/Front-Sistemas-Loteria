// ============================================================
// Archivo: src/app/services/ventas.service.ts
// Descripción:
// Servicio Angular para registrar ventas de billetes y consultar
// el historial de compras por cliente. Implementa llamadas HTTP
// hacia el backend usando HttpClient e incluye normalización de
// respuestas cuando el backend devuelve solo arreglos de billetes.
// ============================================================

import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../environments/environment';
import { Billete } from '../models/billete';

/**
 * Estructura del cuerpo de la solicitud de venta enviada al backend.
 * Se espera que el backend registre la venta, marque el billete como
 * "VENDIDO" y asocie el cliente al billete/sorteo.
 *
 * Ejemplo de payload:
 * {
 *   sorteoId: 3,
 *   billeteId: 42,
 *   clienteId: 7
 * }
 */
export interface VentaRequest {
  sorteoId: number;
  billeteId: number;
  clienteId: number;
}

/** Entidad mínima de Cliente utilizada en respuestas del historial. */
export interface Cliente {
  id: number;
  nombre: string;
  correo: string;
}

/**
 * Forma normalizada del historial de compras de un cliente.
 * - cliente: datos básicos del cliente.
 * - billetes: arreglo de billetes asociados al cliente.
 */
export interface HistorialResponse {
  cliente: Cliente;
  billetes: Billete[];
}

/**
 * Servicio para ventas y consultas de historial.
 *
 * Endpoints esperados en el backend:
 * - POST  {apiUrl}/ventas
 *     Body: { sorteoId, billeteId, clienteId }
 *     Respuesta: Billete (actualizado con estado "VENDIDO")
 *
 * - GET   {apiUrl}/clientes/historial?correo={correo}
 *     Respuesta recomendada: { cliente, billetes }
 *     Respuesta alternativa: Billete[] (solo el arreglo)
 *
 * Notas:
 * - Este servicio realiza una normalización cuando el backend
 *   devuelve únicamente Billete[] para mantener un contrato
 *   estable en el front.
 */
@Injectable({ providedIn: 'root' })
export class VentasService {
  /** Inyección perezosa del HttpClient (recomendado con inject()). */
  private readonly http = inject(HttpClient);

  /** Prefijos base de los recursos expuestos por el backend. */
  private readonly baseVentas = `${environment.apiUrl}/ventas`;
  private readonly baseClientes = `${environment.apiUrl}/clientes`;

  /**
   * Registra una venta y devuelve el billete actualizado.
   *
   * Método HTTP: POST
   * URL: {apiUrl}/ventas
   * Body: VentaRequest
   *
   * @param payload Cuerpo con sorteoId, billeteId y clienteId.
   * @returns Observable<Billete> con el estado actualizado (p. ej. "VENDIDO").
   *
   * Ejemplo de uso:
   * this.ventasService.venderBillete({ sorteoId: 3, billeteId: 42, clienteId: 7 })
   *   .subscribe(b => console.log('Billete vendido:', b));
   *
   * Ejemplo de cURL (referencial):
   * curl -X POST "{apiUrl}/ventas" \
   *   -H "Content-Type: application/json" \
   *   -d '{"sorteoId":3,"billeteId":42,"clienteId":7}'
   */
  venderBillete(payload: VentaRequest): Observable<Billete> {
    // POST /api/ventas  { sorteoId, billeteId, clienteId }
    return this.http.post<Billete>(this.baseVentas, payload);
  }

  /**
   * Obtiene el historial completo por correo.
   *
   * Método HTTP: GET
   * URL: {apiUrl}/clientes/historial?correo=...
   *
   * El método soporta dos formatos de respuesta del backend:
   * 1) Forma recomendada:
   *    {
   *      "cliente": { "id": 7, "nombre": "Juan", "correo": "juan@..." },
   *      "billetes": [ ... ]
   *    }
   * 2) Forma alternativa (solo arreglo de Billete):
   *    [ ... ]
   *
   * En el caso 2, se normaliza a HistorialResponse con un cliente mínimo
   * y el correo entregado como argumento.
   *
   * @param correo Correo electrónico del cliente a consultar.
   * @returns Observable<HistorialResponse> con cliente y billetes.
   *
   * Ejemplo de uso:
   * this.ventasService.getHistorialPorCliente('usuario@dominio.com')
   *   .subscribe(h => console.log(h.cliente, h.billetes));
   */
  getHistorialPorCliente(correo: string): Observable<HistorialResponse> {
    const params = new HttpParams().set('correo', correo);

    return this.http
      .get<HistorialResponse | Billete[]>(`${this.baseClientes}/historial`, { params })
      .pipe(
        // Normaliza en caso de que el backend devuelva solo Billete[]
        map((res: HistorialResponse | Billete[]) => {
          if (Array.isArray(res)) {
            const normalizado: HistorialResponse = {
              cliente: { id: 0, nombre: '', correo },
              billetes: res,
            };
            return normalizado;
          }
          return res as HistorialResponse;
        })
      );
  }
}
