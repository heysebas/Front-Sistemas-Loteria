import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { VentasService } from '../../../services/ventas.service';
import { Billete } from '../../../models/billete';

type Cliente = { id: number; nombre: string; correo: string };

@Component({
  selector: 'app-historial-cliente',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './historial-cliente.component.html',
  styleUrls: ['./historial-cliente.component.scss'],
})
export class HistorialClienteComponent {
  // Inyecciones
  private fb = inject(FormBuilder);
  private ventas = inject(VentasService);

  // Form
  f = this.fb.group({
    correo: ['', [Validators.required, Validators.email]],
  });

  // Estado de UI
  loading = false;
  intentado = false;

  // Datos
  cliente: Cliente | null = null;
  billetes: Billete[] = [];
  error: string | null = null;

  buscar(): void {
    this.intentado = true;
    this.error = null;
    if (this.f.invalid) return;

    this.loading = true;
    this.billetes = [];
    this.cliente = null;

    const correo = this.f.value.correo!.trim();

    this.ventas.getHistorialPorCliente(correo).subscribe({
      next: (res: { cliente: Cliente; billetes: Billete[] }) => {
        // Normaliza por si el backend devolviera sólo la lista de billetes
        const cliente = (res && (res as any).cliente) ? res.cliente : { id: 0, nombre: '', correo };
        const billetes = (res && (res as any).billetes) ? res.billetes : (res as unknown as Billete[]);

        this.cliente = cliente;
        // Ordenar más recientes primero (por id desc)
        this.billetes = (billetes ?? []).slice().sort((a, b) => (b.id ?? 0) - (a.id ?? 0));
        this.loading = false;
      },
      error: (err) => {
        this.error =
          (err?.error?.message || err?.message || 'No fue posible consultar el historial') +
          (err?.status ? ` (HTTP ${err.status})` : '');
        this.loading = false;
      },
    });
  }
}
