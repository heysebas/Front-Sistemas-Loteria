import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { VentasService } from '../../../services/ventas.service';
import { Billete } from '../../../models/billete';
import Swal from 'sweetalert2';

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
        const cliente = (res && (res as any).cliente)
          ? res.cliente
          : { id: 0, nombre: '', correo };
        const billetes = (res && (res as any).billetes)
          ? res.billetes
          : (res as unknown as Billete[]);

        // Si no se encontró cliente o billetes, mostrar alerta
        if ((!cliente || !cliente.id) && (!billetes || billetes.length === 0)) {
          Swal.fire({
            title: 'Cliente no encontrado',
            text: 'No existe ningún cliente registrado con ese correo electrónico.',
            icon: 'warning',
            confirmButtonText: 'Entendido',
          });
          this.loading = false;
          return;
        }

        this.cliente = cliente;
        // Ordenar más recientes primero (por id desc)
        this.billetes = (billetes ?? []).slice().sort((a, b) => (b.id ?? 0) - (a.id ?? 0));
        this.loading = false;
      },

      error: (err) => {
        this.loading = false;

        const msg = err?.error?.message?.toLowerCase?.() || '';

        // 🔹 Si el backend devuelve 400 o 404 con mensaje "cliente no encontrado"
        if ((err?.status === 400 || err?.status === 404) && msg.includes('cliente')) {
          Swal.fire({
            title: 'Cliente no encontrado',
            text: 'Verifica el correo ingresado e inténtalo nuevamente.',
            icon: 'warning',
            confirmButtonText: 'Cerrar',
          });
          return;
        }

        // 🔹 Cualquier otro error genérico
        Swal.fire({
          title: 'Error al consultar',
          text: 'No fue posible obtener el historial. Intenta nuevamente.',
          icon: 'error',
          confirmButtonText: 'Cerrar',
        });
      },
    });
  }
}
