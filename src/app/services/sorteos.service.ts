import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';
import { Sorteo } from '../models/sorteo';
import { Billete } from '../models/billete';

@Injectable({ providedIn: 'root' })
export class SorteosService {
  private base = `${environment.apiUrl}/sorteos`;

  constructor(private http: HttpClient) {}

  listarSorteos(): Observable<Sorteo[]> {
    return this.http.get<Sorteo[]>(this.base);
  }

  billetes(sorteoId: number): Observable<Billete[]> {
    return this.http.get<Billete[]>(`${this.base}/${sorteoId}/billetes`);
  }

  venderBillete(billeteId: number, clienteId: number) {
    return this.http.post(`${environment.apiUrl}/billetes/${billeteId}/vender`, { clienteId });
  }
}
