import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ClientesService } from '../../../services/clientes.service';

@Component({
  selector: 'app-historial-cliente',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './historial-cliente.component.html',
  styleUrls: ['./historial-cliente.component.scss'],
})
export class HistorialClienteComponent {

  private fb = inject(FormBuilder);
  private clientes = inject(ClientesService);


  f = this.fb.group({
    correo: ['', [Validators.required, Validators.email]],
  });

  loading = false;
  intentado = false;

  cliente: any = null;
  billetes: any[] = [];
  error: string | null = null;

  buscar(): void {
    this.intentado = true;
    this.error = null;
    if (this.f.invalid) return;

    this.loading = true;
    this.billetes = [];
    this.cliente = null;

    const correo = this.f.value.correo!;

    this.clientes.buscarPorCorreo(correo).subscribe({
      next: (c) => {
        if (!c) {
          this.loading = false;
          this.error = 'Cliente no encontrado.';
          return;
        }
        this.cliente = c;
        this.clientes.billetesVendidos(c.id).subscribe({
          next: (bs) => {
            this.billetes = bs ?? [];
            this.loading = false;
          },
          error: () => {
            this.error = 'Error consultando billetes.';
            this.loading = false;
          },
        });
      },
      error: () => {
        this.error = 'Error consultando cliente.';
        this.loading = false;
      },
    });
  }
}
