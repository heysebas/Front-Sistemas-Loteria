// src/app/services/clientes.service.ts
import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../environments/environment';

export type ClienteCreate = {
  nombre: string;
  correo: string;
};

export type Cliente = ClienteCreate & { id: number };

@Injectable({ providedIn: 'root' })
export class ClientesService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/clientes`;

  crear(payload: ClienteCreate) {
    return this.http.post<Cliente>(this.base, payload);
  }
}
