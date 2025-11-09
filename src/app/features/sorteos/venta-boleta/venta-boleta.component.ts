// ============================================================
// Archivo: src/app/features/sorteos/venta-boleta.component.ts
// Descripción:
// Pantalla de venta de boletas para un sorteo. Soporta:
// - Selección única (flujo tradicional).
// - Selección múltiple (varias boletas en una sola operación).
// - Manejo optimista con rollback en caso de error.
// - Carga de compradores para resumen de ventas del sorteo.
// - Reacción a parámetro de ruta /venta/:id para preselección.
// ============================================================

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  Validators,
  FormGroup,
  FormControl,
} from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';

import { SorteosService } from '../../../services/sorteos.service';
import { VentasService, VentaRequest } from '../../../services/ventas.service';
import { ClientesService } from '../../../services/clientes.service';

import { Sorteo } from '../../../models/sorteo';
import { Billete } from '../../../models/billete';
import { Cliente } from '../../../models/cliente';

import Swal from 'sweetalert2';

// Estructura para representar un comprador en el resumen de ventas.
type CompradorItem = {
  id: number;
  nombre: string;
  correo?: string | null;
  numero: string | number;
  precio: number;
  fecha?: string | null;
};

@Component({
  selector: 'app-venta-boleta',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './venta-boleta.component.html',
  styleUrls: ['./venta-boleta.component.scss'],
})
export class VentaBoletaComponent implements OnInit {
  // Catálogos
  sorteosActivos: Sorteo[] = [];
  clientes: Cliente[] = [];

  // Estado de selección
  seleccionado: Sorteo | null = null;
  billetes: Billete[] = [];
  billeteSeleccionado: Billete | null = null;

  // Modo de selección múltiple (se activa con un checkbox en la plantilla)
  ventaMultiple = false;
  seleccionMultipleIds: Set<number> = new Set<number>(); // ids de billetes seleccionados
  procesandoIds: Set<number> = new Set<number>();        // ids en proceso de venta

  // Estado de UI
  cargandoBilletes = false;
  vendiendo = false;
  ventaMsg = '';

  // Compradores (resumen por sorteo)
  cargandoCompradores = false;
  compradores: CompradorItem[] = [];

  // Formulario reactivo
  form!: FormGroup<{
    sorteoId: FormControl<number | null>;
    clienteId: FormControl<number | null>;
    billeteId: FormControl<number | null>;
  }>;

  constructor(
    private fb: FormBuilder,
    private sorteosSrv: SorteosService,
    private ventasSrv: VentasService,
    private clientesSrv: ClientesService,
    private route: ActivatedRoute
  ) {
    this.form = this.fb.nonNullable.group({
      sorteoId: this.fb.control<number | null>(null, { validators: [Validators.required] }),
      clienteId: this.fb.control<number | null>(null, { validators: [Validators.required] }),
      billeteId: this.fb.control<number | null>(null, { validators: [Validators.required] }),
    });
  }

  // ============================================================
  // Ciclo de vida
  // ============================================================
  ngOnInit(): void {
    // 1) Cargar sorteos y preseleccionar por ruta si aplica
    this.sorteosSrv.listar().subscribe({
      next: (all: Sorteo[]) => {
        this.sorteosActivos = all
          .filter(s => this.esActivo(s))
          .sort((a, b) => new Date(a.fechaSorteo).getTime() - new Date(b.fechaSorteo).getTime());
        this.preseleccionarDesdeRuta();
      },
      error: () => {
        Swal.fire({
          title: 'Error',
          text: 'No fue posible cargar los sorteos.',
          icon: 'error',
          confirmButtonText: 'Cerrar'
        });
      }
    });

    // 2) Cargar clientes
    this.clientesSrv.listar().subscribe({
      next: (cs) => (this.clientes = cs),
      error: () => {
        Swal.fire({
          title: 'Error',
          text: 'No fue posible cargar los clientes.',
          icon: 'error',
          confirmButtonText: 'Cerrar'
        });
      }
    });

    // 3) Reaccionar a cambios del parámetro :id mientras estamos en la vista
    this.route.paramMap.subscribe(pm => {
      const idParam = pm.get('id');
      if (!idParam) return;
      const id = Number(idParam);
      if (this.sorteosActivos.length) {
        const existe = this.sorteosActivos.some(s => s.id === id);
        if (existe) this.onSelectSorteo(id);
      }
    });
  }

  // ============================================================
  // Helpers de modo y selección
  // ============================================================
  setModo(multiple: boolean) {
    this.ventaMultiple = !!multiple;
    this.ventaMsg = '';
    this.billeteSeleccionado = null;
    this.form.patchValue({ billeteId: null });
    this.seleccionMultipleIds.clear();
  }

  estaSeleccionado(id: number): boolean {
    return this.seleccionMultipleIds.has(id);
  }

  toggleSeleccion(b: Billete) {
    if (this.vendiendo || b.estado !== 'DISPONIBLE') return;
    if (this.seleccionMultipleIds.has(b.id)) {
      this.seleccionMultipleIds.delete(b.id);
    } else {
      this.seleccionMultipleIds.add(b.id);
    }
  }

  // Resumen de selección múltiple para usar en la plantilla sin lógica compleja en HTML
  get seleccionMultipleResumen(): string {
    if (!this.seleccionMultipleIds.size) return '';
    const ids = Array.from(this.seleccionMultipleIds);
    return ids
      .map(id => {
        const b = this.billetes.find(x => x.id === id);
        return `#${b ? b.numero : id}`;
      })
      .join(', ');
  }

  // ============================================================
  // Selección de sorteo y carga asociada
  // ============================================================
  private preseleccionarDesdeRuta(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (!idParam) return;
    const id = Number(idParam);
    const existe = this.sorteosActivos.some(s => s.id === id);
    if (existe) this.onSelectSorteo(id);
  }

  // Considera activo si la fecha del sorteo no ha pasado (desde 00:00 del día actual) y no está marcado como inactivo.
  private esActivo(s: Sorteo): boolean {
    const hoy = new Date();
    const inicioHoy = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate(), 0, 0, 0, 0);
    const fecha = new Date(s.fechaSorteo);
    const noPaso = fecha.getTime() >= inicioHoy.getTime();
    const flagActivo = (s as any).activo === undefined ? true : Boolean((s as any).activo);
    return noPaso && flagActivo;
  }

  onSelectSorteo(sorteoId: number | string) {
    const sorteoIdNum = Number(sorteoId || 0);
    const s = this.sorteosActivos.find(x => x.id === sorteoIdNum) || null;

    this.seleccionado = s;
    this.form.patchValue({ sorteoId: sorteoIdNum, billeteId: null });
    this.billeteSeleccionado = null;
    this.ventaMsg = '';
    this.compradores = [];
    this.seleccionMultipleIds.clear();

    if (!s) {
      this.billetes = [];
      return;
    }

    if (!this.esActivo(s)) {
      this.ventaMsg = 'Este sorteo ya no está activo.';
      this.billetes = [];
      Swal.fire({
        title: 'Sorteo inactivo',
        text: 'Este sorteo ya pasó o fue desactivado. No es posible vender.',
        icon: 'warning',
        confirmButtonText: 'Entendido'
      });
      return;
    }

    this.cargarBilletes(s.id);
    this.loadCompradores(s.id);
  }

  private normalizarBillete(b: Billete): Billete {
    return {
      ...b,
      numero: Number((b as any).numero),
      precio: Number((b as any).precio),
    } as any;
  }

  private ordenarPorEstado(): void {
    const disponibles = this.billetes
      .filter(b => b.estado === 'DISPONIBLE')
      .sort((a, b) => (a.numero as number) - (b.numero as number));
    const vendidos = this.billetes
      .filter(b => b.estado === 'VENDIDO')
      .sort((a, b) => (a.numero as number) - (b.numero as number));
    this.billetes = [...disponibles, ...vendidos];
  }

  private cargarBilletes(sorteoId: number) {
    this.cargandoBilletes = true;
    this.sorteosSrv.billetesPorSorteo(sorteoId).subscribe({
      next: (raw: Billete[]) => {
        this.billetes = raw.map(b => this.normalizarBillete(b));
        this.ordenarPorEstado();
        this.cargandoBilletes = false;
      },
      error: () => {
        this.cargandoBilletes = false;
        Swal.fire({
          title: 'Error',
          text: 'No fue posible cargar los billetes del sorteo.',
          icon: 'error',
          confirmButtonText: 'Cerrar'
        });
      },
    });
  }

  // ============================================================
  // Selección única (flujo tradicional)
  // ============================================================
  seleccionarBillete(b: Billete) {
    if (this.vendiendo) return;
    if (b.estado !== 'DISPONIBLE') {
      Swal.fire({
        title: 'No disponible',
        text: 'Ese billete ya fue vendido.',
        icon: 'warning',
        confirmButtonText: 'Entendido'
      });
      return;
    }

    if (!this.ventaMultiple) {
      this.billeteSeleccionado = b;
      this.form.patchValue({ billeteId: b.id });
      this.ventaMsg = '';
    } else {
      // En modo múltiple, el mismo botón alterna selección
      this.toggleSeleccion(b);
    }
  }

  // ============================================================
  // Acción principal de venta (auto-detecta única vs múltiple)
  // ============================================================
  async vender() {
    if (!this.seleccionado) {
      Swal.fire({ title: 'Selecciona un sorteo', icon: 'warning', confirmButtonText: 'Entendido' });
      return;
    }
    if (!this.form.value.clienteId) {
      Swal.fire({ title: 'Selecciona un cliente', icon: 'warning', confirmButtonText: 'Entendido' });
      return;
    }
    if (!this.esActivo(this.seleccionado)) {
      this.ventaMsg = 'El sorteo ya no está activo. No es posible comprar.';
      Swal.fire({
        title: 'Sorteo inactivo',
        text: 'El sorteo ya pasó. No es posible realizar la venta.',
        icon: 'warning',
        confirmButtonText: 'Entendido'
      });
      return;
    }

    const esMultiple = this.ventaMultiple && this.seleccionMultipleIds.size > 0;

    if (!esMultiple) {
      // Venta única
      if (!this.billeteSeleccionado) {
        Swal.fire({ title: 'Selecciona un billete', icon: 'warning', confirmButtonText: 'Entendido' });
        return;
      }

      const confirm = await Swal.fire({
        title: 'Confirmar venta',
        html: `
          <div style="text-align:left">
            <p><b>Sorteo:</b> ${this.seleccionado.nombre}</p>
            <p><b>Billete:</b> ${this.billeteSeleccionado.numero}</p>
            <p><b>Precio:</b> ${this.billeteSeleccionado.precio}</p>
          </div>
        `,
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Vender',
        cancelButtonText: 'Cancelar'
      });
      if (!confirm.isConfirmed) return;

      await this.venderUnico();
      return;
    }

    // Venta múltiple
    await this.venderMultiple();
  }

  // ============================================================
  // Venta única (optimista con rollback)
  // ============================================================
  private async venderUnico() {
    const b = this.billeteSeleccionado!;
    const payload: VentaRequest = {
      sorteoId: this.seleccionado!.id,
      billeteId: b.id,
      clienteId: this.form.value.clienteId!,
    };

    const idx = this.billetes.findIndex(x => x.id === b.id);
    const previo = idx >= 0 ? { ...this.billetes[idx] } : null;

    // Optimista
    if (idx >= 0) {
      this.billetes[idx] = { ...this.billetes[idx], estado: 'VENDIDO' as any };
      this.ordenarPorEstado();
    }

    this.vendiendo = true;
    this.ventaMsg = 'Procesando...';

    await new Promise<void>((resolve) => {
      this.ventasSrv.venderBillete(payload).subscribe({
        next: (res: Billete) => {
          const actualizado = this.normalizarBillete(res);
          if (idx >= 0) this.billetes[idx] = actualizado;
          this.ordenarPorEstado();

          this.ventaMsg = 'Vendido correctamente';
          this.billeteSeleccionado = null;
          this.form.patchValue({ billeteId: null });
          this.vendiendo = false;

          Swal.fire({
            title: 'Venta realizada',
            text: 'El billete se vendió correctamente.',
            icon: 'success',
            confirmButtonText: 'Perfecto'
          });

          this.cargarBilletes(this.seleccionado!.id);
          this.loadCompradores(this.seleccionado!.id);
          resolve();
        },
        error: (err) => {
          if (previo && idx >= 0) this.billetes[idx] = previo;
          this.ordenarPorEstado();
          this.vendiendo = false;

          if (err?.status === 409) {
            this.ventaMsg = 'Ese billete ya fue comprado por otra persona.';
            Swal.fire({
              title: 'Billete no disponible',
              text: 'Ese billete ya fue comprado por otra persona.',
              icon: 'warning',
              confirmButtonText: 'Entendido'
            });
            this.cargarBilletes(this.seleccionado!.id);
            this.loadCompradores(this.seleccionado!.id);
          } else {
            this.ventaMsg = 'Error al vender';
            Swal.fire({
              title: 'Error',
              text: 'No se pudo completar la venta. Intenta nuevamente.',
              icon: 'error',
              confirmButtonText: 'Cerrar'
            });
          }
          resolve();
        },
      });
    });
  }

  // ============================================================
  // Venta múltiple (un insert por boleta, con resumen final)
  // ============================================================
  private async venderMultiple() {
    const ids = Array.from(this.seleccionMultipleIds);
    if (!ids.length) return;

    // Resumen previo
    const lista = ids
      .map(id => {
        const b = this.billetes.find(x => x.id === id);
        return b ? `#${b.numero} ($${b.precio})` : `ID ${id}`;
      })
      .join(', ');

    const total = ids.reduce((acc, id) => {
      const b = this.billetes.find(x => x.id === id);
      return acc + (b ? Number(b.precio || 0) : 0);
    }, 0);

    const confirm = await Swal.fire({
      title: 'Confirmar venta múltiple',
      html: `
        <div style="text-align:left">
          <p><b>Sorteo:</b> ${this.seleccionado!.nombre}</p>
          <p><b>Billetes:</b> ${lista}</p>
          <p><b>Total:</b> $${total}</p>
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Vender',
      cancelButtonText: 'Cancelar'
    });
    if (!confirm.isConfirmed) return;

    // Optimista por cada billete
    const previos: Record<number, Billete> = {};
    for (const id of ids) {
      const idx = this.billetes.findIndex(x => x.id === id);
      if (idx >= 0) {
        previos[id] = { ...this.billetes[idx] };
        this.billetes[idx] = { ...this.billetes[idx], estado: 'VENDIDO' as any };
        this.procesandoIds.add(id);
      }
    }
    this.ordenarPorEstado();
    this.vendiendo = true;
    this.ventaMsg = 'Procesando venta múltiple...';

    const exitos: number[] = [];
    const fallos: number[] = [];

    // Vender secuencialmente para minimizar colisiones de concurrencia
    for (const id of ids) {
      // eslint-disable-next-line no-await-in-loop
      await new Promise<void>((resolve) => {
        const payload: VentaRequest = {
          sorteoId: this.seleccionado!.id,
          billeteId: id,
          clienteId: this.form.value.clienteId!,
        };

        this.ventasSrv.venderBillete(payload).subscribe({
          next: () => {
            const b = this.billetes.find(x => x.id === id);
            const numero = b ? Number(b.numero) : id;
            exitos.push(numero);
            resolve();
          },
          error: () => {
            // Revertir solo el que falló
            const idx = this.billetes.findIndex(x => x.id === id);
            if (idx >= 0 && previos[id]) this.billetes[idx] = previos[id];
            const b = this.billetes.find(x => x.id === id);
            const numero = b ? Number(b.numero) : id;
            fallos.push(numero);
            resolve();
          }
        });
      });
    }

    this.ordenarPorEstado();
    this.vendiendo = false;
    this.procesandoIds.clear();
    this.seleccionMultipleIds.clear();

    // Resumen final
    const msg =
      `Éxitos: ${exitos.length}` +
      (exitos.length ? ` (${exitos.map(n => `#${n}`).join(', ')})` : '') +
      `\nFallos: ${fallos.length}` +
      (fallos.length ? ` (${fallos.map(n => `#${n}`).join(', ')})` : '');

    if (fallos.length === 0) {
      Swal.fire({ title: 'Venta múltiple completa', text: msg, icon: 'success', confirmButtonText: 'Listo' });
    } else if (exitos.length === 0) {
      Swal.fire({ title: 'No se vendió ningún billete', text: msg, icon: 'warning', confirmButtonText: 'Entendido' });
    } else {
      Swal.fire({ title: 'Venta parcial', text: msg, icon: 'warning', confirmButtonText: 'Entendido' });
    }

    // Refrescar datos reales
    this.cargarBilletes(this.seleccionado!.id);
    this.loadCompradores(this.seleccionado!.id);
    this.ventaMsg = '';
  }

  // ============================================================
  // Carga de compradores del sorteo
  // (se reutiliza billetesPorSorteo y se filtran los vendidos)
  // ============================================================
  private loadCompradores(sorteoId: number): void {
    this.cargandoCompradores = true;
    this.compradores = [];

    this.sorteosSrv.billetesPorSorteo(sorteoId).subscribe({
      next: (billetes: Billete[]) => {
        const vendidos = (billetes || []).filter(b => (b as any).estado === 'VENDIDO');
        this.compradores = vendidos.map((b: any) => ({
          id: b.cliente?.id ?? 0,
          nombre: b.cliente?.nombre ?? '—',
          correo: b.cliente?.correo ?? null,
          numero: b.numero,
          precio: Number(b.precio ?? 0),
          fecha: b.fechaVenta ?? null,
        }));
        this.compradores.sort((a, b) => {
          if (a.fecha && b.fecha) return new Date(b.fecha).getTime() - new Date(a.fecha).getTime();
          return Number(a.numero) - Number(b.numero);
        });
        this.cargandoCompradores = false;
      },
      error: () => {
        this.cargandoCompradores = false;
      }
    });
  }

  // ============================================================
  // Getters útiles para plantilla
  // ============================================================
  get precioBoleta(): number {
    if (this.billeteSeleccionado) return Number(this.billeteSeleccionado.precio || 0);
    const ref = this.billetes.find(b => !!b.precio);
    return Number(ref?.precio || 0);
  }

  get totalVendido(): number {
    return this.billetes
      .filter(b => b.estado === 'VENDIDO')
      .reduce((acc, b) => acc + Number(b.precio || 0), 0);
  }

  get disponiblesCount(): number {
    return this.billetes.reduce((acc, b) => acc + (b.estado === 'DISPONIBLE' ? 1 : 0), 0);
  }

  get vendidosCount(): number {
    return this.billetes.reduce((acc, b) => acc + (b.estado === 'VENDIDO' ? 1 : 0), 0);
  }

  // Total de la selección múltiple
  get seleccionMultipleTotal(): number {
    return Array.from(this.seleccionMultipleIds).reduce((sum, id) => {
      const b = this.billetes.find(x => x.id === id);
      return sum + (b ? Number(b.precio || 0) : 0);
    }, 0);
  }
}
