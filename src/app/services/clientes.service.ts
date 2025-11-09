// ============================================================
// Archivo: src/app/services/clientes.service.ts
// Descripción:
// Servicio Angular encargado de la gestión de clientes en el
// sistema de lotería. Permite crear, listar y consultar clientes,
// así como obtener los billetes vendidos y verificar la existencia
// de un correo electrónico registrado.
// ============================================================

import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../environments/environment';
import { Cliente } from '../models/cliente';
import { Billete } from '../models/billete';
import { Observable, of, map, catchError } from 'rxjs';

/**
 * Estructura del cuerpo para crear un nuevo cliente.
 * Contiene únicamente los campos básicos requeridos.
 */
export type ClienteCreate = {
  nombre: string;
  correo: string;
};

/**
 * Servicio principal de clientes.
 *
 * Endpoints esperados en el backend:
 * - POST   {apiUrl}/clientes
 * - GET    {apiUrl}/clientes
 * - GET    {apiUrl}/clientes/correo/{correo}
 * - GET    {apiUrl}/clientes/{id}/billetes
 * - GET    {apiUrl}/clientes/existe?correo={correo}
 */
@Injectable({ providedIn: 'root' })
export class ClientesService {
  /** Inyección de HttpClient mediante la función inject(). */
  private readonly http = inject(HttpClient);

  /** URL base del recurso de clientes. */
  private readonly base = `${environment.apiUrl}/clientes`;

  // ============================================================
  // CREAR CLIENTE
  // ------------------------------------------------------------
  // Registra un nuevo cliente en el sistema.
  //
  // Método HTTP: POST
  // URL: {apiUrl}/clientes
  // Body: { nombre, correo }
  //
  // @param payload Datos del cliente.
  // @returns Observable<Cliente>
  //
  // Ejemplo:
  // this.clientesService.crear({ nombre: 'Juan', correo: 'juan@ejemplo.com' })
  //   .subscribe(c => console.log('Cliente creado:', c));
  // ============================================================
  crear(payload: ClienteCreate): Observable<Cliente> {
    return this.http.post<Cliente>(this.base, payload);
  }

  // ============================================================
  // LISTAR CLIENTES
  // ------------------------------------------------------------
  // Devuelve todos los clientes registrados.
  //
  // Método HTTP: GET
  // URL: {apiUrl}/clientes
  //
  // @returns Observable<Cliente[]>
  //
  // Ejemplo:
  // this.clientesService.listar().subscribe(lista => console.log(lista));
  // ============================================================
  listar(): Observable<Cliente[]> {
    return this.http.get<Cliente[]>(this.base);
  }

  // ============================================================
  // BUSCAR CLIENTE POR CORREO
  // ------------------------------------------------------------
  // Busca un cliente específico por su correo electrónico.
  //
  // Método HTTP: GET
  // URL: {apiUrl}/clientes/correo/{correo}
  //
  // @param correo Correo electrónico del cliente.
  // @returns Observable<Cliente>
  //
  // Ejemplo:
  // this.clientesService.buscarPorCorreo('ana@ejemplo.com')
  //   .subscribe(c => console.log('Cliente encontrado:', c));
  // ============================================================
  buscarPorCorreo(correo: string): Observable<Cliente> {
    return this.http.get<Cliente>(
      `${this.base}/correo/${encodeURIComponent(correo)}`
    );
  }

  // ============================================================
  // BILLETES VENDIDOS POR CLIENTE
  // ------------------------------------------------------------
  // Obtiene todos los billetes vendidos asociados a un cliente.
  //
  // Método HTTP: GET
  // URL: {apiUrl}/clientes/{id}/billetes
  //
  // @param clienteId ID del cliente.
  // @returns Observable<Billete[]>
  //
  // Ejemplo:
  // this.clientesService.billetesVendidos(5)
  //   .subscribe(b => console.log('Billetes del cliente:', b));
  // ============================================================
  billetesVendidos(clienteId: number): Observable<Billete[]> {
    return this.http.get<Billete[]>(`${this.base}/${clienteId}/billetes`);
  }

  // ============================================================
  // VERIFICAR EXISTENCIA DE CORREO
  // ------------------------------------------------------------
  // Comprueba si un correo ya está registrado en el sistema.
  //
  // Método HTTP: GET
  // URL: {apiUrl}/clientes/existe?correo=...
  //
  // Si el endpoint no existe en el backend, se puede usar la
  // alternativa comentada más abajo para verificar localmente.
  //
  // @param correo Correo electrónico a verificar.
  // @returns Observable<boolean> (true si existe, false si no)
  //
  // Ejemplo:
  // this.clientesService.existeCorreo('prueba@correo.com')
  //   .subscribe(existe => console.log('¿Existe?', existe));
  // ============================================================
  existeCorreo(correo: string): Observable<boolean> {
    if (!correo) return of(false);

    // Versión principal: con endpoint /clientes/existe?correo=
    return this.http
      .get<{ existe: boolean }>(`${this.base}/existe`, { params: { correo } })
      .pipe(
        map((res) => !!res.existe),
        catchError(() => of(false))
      );
  }
}
