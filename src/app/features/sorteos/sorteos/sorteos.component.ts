import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { SorteosService } from '../../../services/sorteos.service';
import { ClientesService } from '../../../services/clientes.service';
import { Sorteo } from '../../../models/sorteo';
import { Billete } from '../../../models/billete';

@Component({
  selector: 'app-sorteos',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './sorteos.component.html',
  styleUrls: ['./sorteos.component.scss'],
})
export class SorteosComponent implements OnInit {
  // Inyección moderna (disponible en inicializadores de propiedades)
  private fb = inject(FormBuilder);
  private sorteosSrv = inject(SorteosService);
  private clientesSrv = inject(ClientesService);

  // Estado
  sorteos = signal<Sorteo[]>([]);
  billetes = signal<Billete[]>([]);
  seleccionado = signal<Sorteo | null>(null);

  // Formulario (ya no dispara TS2729)
  ventaForm = this.fb.group({
    billeteId: ['', Validators.required],
    correo: ['', [Validators.required, Validators.email]],
  });

  msg: { type: 'ok' | 'error'; text: string } | null = null;
  cargando = false;
  vendiendo = false;

  // (sin constructor; no es necesario al usar inject)
  ngOnInit(): void {
    this.cargarSorteos();
  }

  cargarSorteos(): void {
    this.cargando = true;
    this.sorteosSrv.listarSorteos().subscribe({
      next: (res) => {
        this.sorteos.set(res);
        this.cargando = false;
      },
      error: () => {
        this.msg = { type: 'error', text: 'Error al cargar los sorteos.' };
        this.cargando = false;
      },
    });
  }

  seleccionarSorteo(s: Sorteo): void {
    this.seleccionado.set(s);
    this.billetes.set([]);
    this.sorteosSrv.billetes(s.id).subscribe({
      next: (res) => this.billetes.set(res),
      error: () => {
        this.msg = { type: 'error', text: 'Error al cargar los billetes.' };
      },
    });
  }

  vender(): void {
    if (this.ventaForm.invalid) return;
    const { billeteId, correo } = this.ventaForm.value;
    if (!billeteId || !correo) return;

    this.vendiendo = true;
    this.msg = null;

    // 1) Buscar cliente por correo
    this.clientesSrv.buscarPorCorreo(correo).subscribe({
      next: (cli) => {
        if (!cli) {
          this.msg = { type: 'error', text: 'Cliente no encontrado.' };
          this.vendiendo = false;
          return;
        }

        // 2) Vender billete
        this.sorteosSrv.venderBillete(+billeteId, cli.id).subscribe({
          next: () => {
            this.msg = { type: 'ok', text: 'Venta registrada correctamente.' };
            this.vendiendo = false;
            this.ventaForm.reset();

            // refrescar listado de billetes del sorteo seleccionado
            const s = this.seleccionado();
            if (s) this.seleccionarSorteo(s);
          },
          error: () => {
            this.msg = { type: 'error', text: 'No se pudo registrar la venta.' };
            this.vendiendo = false;
          },
        });
      },
      error: () => {
        this.msg = { type: 'error', text: 'Error consultando cliente.' };
        this.vendiendo = false;
      },
    });
  }
}
