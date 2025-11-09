// ============================================================
// Archivo: src/app/services/sorteos.service.ts
// Descripción:
// Servicio encargado de interactuar con el backend para la
// gestión de sorteos y sus billetes asociados. Incluye métodos
// para listar, crear y consultar sorteos, así como para generar
// y obtener billetes de cada sorteo.
// ============================================================

import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';
import { Sorteo } from '../models/sorteo';
import { Billete } from '../models/billete';

/**
 * Servicio para manejar la comunicación con los endpoints del backend
 * relacionados con sorteos y billetes.
 *
 * Endpoints esperados:
 * - GET    {apiUrl}/sorteos
 * - GET    {apiUrl}/sorteos/{id}
 * - POST   {apiUrl}/sorteos
 * - POST   {apiUrl}/sorteos/{id}/billetes?cantidad=..&precio=..
 * - GET    {apiUrl}/sorteos/{id}/billetes
 */
@Injectable({ providedIn: 'root' })
export class SorteosService {
  /** URL base del recurso de sorteos en el backend */
  private readonly base = `${environment.apiUrl}/sorteos`;

  constructor(private http: HttpClient) {}

  // ============================================================
  // LISTAR SORTEOS
  // ------------------------------------------------------------
  // Devuelve un arreglo con todos los sorteos registrados.
  //
  // Método HTTP: GET
  // URL: {apiUrl}/sorteos
  //
  // Ejemplo de uso:
  // this.sorteosService.listar().subscribe(data => console.log(data));
  // ============================================================
  listar(): Observable<Sorteo[]> {
    return this.http.get<Sorteo[]>(this.base);
  }

  // ============================================================
  // OBTENER SORTEO POR ID
  // ------------------------------------------------------------
  // Devuelve la información completa de un sorteo específico,
  // incluyendo su nombre, fecha y demás atributos.
  //
  // Método HTTP: GET
  // URL: {apiUrl}/sorteos/{id}
  //
  // @param sorteoId ID del sorteo.
  // @returns Observable<Sorteo>
  // ============================================================
  obtenerPorId(sorteoId: number): Observable<Sorteo> {
    return this.http.get<Sorteo>(`${this.base}/${sorteoId}`);
  }

  // ============================================================
  // CREAR SORTEO
  // ------------------------------------------------------------
  // Registra un nuevo sorteo con nombre y fecha de realización.
  //
  // Método HTTP: POST
  // URL: {apiUrl}/sorteos
  // Body: { nombre: string, fechaSorteo: string }
  //
  // @param payload Objeto con nombre y fecha del sorteo.
  // @returns Observable<Sorteo>
  // ============================================================
  crear(payload: { nombre: string; fechaSorteo: string }): Observable<Sorteo> {
    return this.http.post<Sorteo>(this.base, payload);
  }

  // ============================================================
  // GENERAR BILLETES PARA UN SORTEO
  // ------------------------------------------------------------
  // Crea una cantidad N de billetes asociados a un sorteo.
  //
  // Método HTTP: POST
  // URL: {apiUrl}/sorteos/{id}/billetes?cantidad=..&precio=..
  // (Si el backend usa body en vez de params, se puede enviar el JSON directamente)
  //
  // @param sorteoId ID del sorteo.
  // @param cantidad Número de billetes a generar.
  // @param precio Valor unitario de cada billete.
  // @returns Observable<Billete[]>
  //
  // Ejemplo:
  // this.sorteosService.generarBilletes(3, 20, 10000)
  //   .subscribe(b => console.log('Billetes generados', b));
  // ============================================================
  generarBilletes(
    sorteoId: number,
    cantidad: number,
    precio: number
  ): Observable<Billete[]> {
    const params = new HttpParams()
      .set('cantidad', String(cantidad))
      .set('precio', String(precio));

    return this.http.post<Billete[]>(
      `${this.base}/${sorteoId}/billetes`,
      null,
      { params }
    );
  }

  // ============================================================
  // LISTAR BILLETES POR SORTEO
  // ------------------------------------------------------------
  // Devuelve todos los billetes de un sorteo, con su estado actual
  // (por ejemplo: DISPONIBLE o VENDIDO).
  //
  // Método HTTP: GET
  // URL: {apiUrl}/sorteos/{id}/billetes
  //
  // @param sorteoId ID del sorteo.
  // @returns Observable<Billete[]>
  //
  // Ejemplo:
  // this.sorteosService.billetesPorSorteo(2)
  //   .subscribe(data => console.log('Billetes:', data));
  // ============================================================
  billetesPorSorteo(sorteoId: number): Observable<Billete[]> {
    return this.http.get<Billete[]>(`${this.base}/${sorteoId}/billetes`);
  }
}
