/**
 * Componente: SorteosComponent
 * ---------------------------------------------
 * Este componente permite crear sorteos, generar billetes asociados,
 * listar sorteos existentes con contadores de vendidos y disponibles,
 * navegar hacia la venta de boletas si el sorteo sigue vigente,
 * y visualizar el detalle de compradores en sorteos finalizados.
 */

import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  Validators,
  FormGroup,
  FormControl,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { firstValueFrom, forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import Swal from 'sweetalert2';

import { SorteosService } from '../../../services/sorteos.service';
import { Sorteo } from '../../../models/sorteo';
import { Billete } from '../../../models/billete';

/** Tipo extendido para incluir contadores de ventas */
type SorteoUI = Sorteo & {
  vendidos: number;
  disponibles: number;
};

/** Estructura para representar una compra individual */
type CompraItem = {
  clienteId: number;
  nombre: string;
  correo?: string | null;
  numero: string | number;
  precio: number;
  fecha?: string | null;
};

/** Estado asociado a un sorteo (para modal de detalle de compras) */
type ComprasEstado = {
  loading: boolean;
  open: boolean; // (se mantiene por compatibilidad)
  items: CompraItem[];
  total: number;
  error?: string | null;
};

@Component({
  selector: 'app-sorteos',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './sorteos.component.html',
  styleUrls: ['./sorteos.component.scss'],
})
export class SorteosComponent implements OnInit {
  /** Bandera de creación de sorteo */
  creando = false;

  /** Mensaje de estado al crear */
  createMsg = '';

  /** Formulario reactivo para crear sorteos */
  createForm!: FormGroup<{
    nombre: FormControl<string>;
    fechaSorteo: FormControl<string>;
    cantidad: FormControl<number>;
    precio: FormControl<number>;
  }>;

  /** Listado de sorteos renderizado */
  sorteos: SorteoUI[] = [];

  /** Bandera de carga del listado de sorteos */
  cargandoSorteos = false;

  /** Estado de compras por sorteo (cacheado para evitar múltiples solicitudes) */
  comprasBySorteo: Record<number, ComprasEstado> = {};

  /** Control del modal de detalle */
  detalleAbierto = false;
  detalleSorteo: SorteoUI | null = null;

  constructor(
    private fb: FormBuilder,
    private sorteosSrv: SorteosService,
    private router: Router,
  ) {
    /**
     * Configuración y validación del formulario de creación.
     * - nombre: requerido, máximo 80 caracteres
     * - fechaSorteo: requerida y no puede ser una fecha pasada
     * - cantidad: mínimo 1
     * - precio: mínimo 0
     */
    this.createForm = this.fb.nonNullable.group({
      nombre: this.fb.nonNullable.control('', {
        validators: [Validators.required, Validators.maxLength(80)],
      }),
      fechaSorteo: this.fb.nonNullable.control('', {
        validators: [Validators.required, this.fechaNoPasadaValidator],
      }),
      cantidad: this.fb.nonNullable.control(100, {
        validators: [Validators.required, Validators.min(1)],
      }),
      precio: this.fb.nonNullable.control(10000, {
        validators: [Validators.required, Validators.min(0)],
      }),
    });
  }

  /** Inicializa el componente cargando los sorteos */
  ngOnInit(): void {
    this.cargarSorteos();
  }

  /** ==========================================================
   *  UTILIDADES DE FECHA
   * ========================================================== */

  /** Devuelve la fecha de hoy a las 00:00 (sin horas/minutos/segundos) */
  private get todayStart(): Date {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }

  /** Fecha mínima (hoy) para usar en controles tipo date */
  minDateStr = (() => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  })();

  /** Validador personalizado: no permite fechas anteriores a hoy */
  private fechaNoPasadaValidator = (ctrl: AbstractControl): ValidationErrors | null => {
    const val = ctrl.value;
    if (!val) return null;
    const pick = new Date(val);
    pick.setHours(0, 0, 0, 0);
    return pick < this.todayStart ? { fechaPasada: true } : null;
  };

  /** ==========================================================
   *  CREAR SORTEO Y GENERAR BILLETES
   * ========================================================== */

  async onCrearSorteo() {
    this.createMsg = '';

    // Validaciones del formulario
    if (this.createForm.invalid) {
      if (this.createForm.get('fechaSorteo')?.errors?.['fechaPasada']) {
        this.createMsg = 'La fecha del sorteo no puede ser anterior a hoy.';
      } else if (this.createForm.get('cantidad')?.errors?.['min']) {
        this.createMsg = 'La cantidad de boletas debe ser al menos 1.';
      } else if (this.createForm.get('precio')?.errors?.['min']) {
        this.createMsg = 'El precio no puede ser negativo.';
      } else {
        this.createMsg = 'Revisa los campos del formulario.';
      }
      return;
    }

    this.creando = true;
    const { nombre, fechaSorteo, cantidad, precio } = this.createForm.getRawValue();

    try {
      // Llamada al backend: crear sorteo
      const sorteo = await firstValueFrom(this.sorteosSrv.crear({ nombre, fechaSorteo }));

      // Si se generó el sorteo, crear los billetes asociados
      if (sorteo?.id) {
        await firstValueFrom(
          this.sorteosSrv.generarBilletes(sorteo.id, Number(cantidad), Number(precio))
        );
      }

      // Mensaje de éxito
      this.createMsg = 'Sorteo creado y billetes generados correctamente.';
      this.createForm.reset({ nombre: '', fechaSorteo: '', cantidad: 100, precio: 10000 });
      this.cargarSorteos();

      // Alerta visual de confirmación
      Swal.fire({
        title: 'Sorteo creado',
        text: 'El sorteo y sus billetes fueron generados correctamente.',
        icon: 'success',
        confirmButtonText: 'Entendido',
        confirmButtonColor: '#06b6d4',
        background: '#0f172a',
        color: '#e6edf7',
      });

    } catch (e) {
      console.error(e);
      this.createMsg = 'Error creando sorteo.';
      Swal.fire({
        title: 'Error',
        text: 'No se pudo crear el sorteo. Intenta de nuevo.',
        icon: 'error',
        confirmButtonText: 'Cerrar',
        confirmButtonColor: '#ef4444',
        background: '#0f172a',
        color: '#e6edf7',
      });
    } finally {
      this.creando = false;
    }
  }

  /** ==========================================================
   *  CARGA DE SORTEOS Y CONTADORES
   * ========================================================== */

  cargarSorteos() {
    this.cargandoSorteos = true;

    this.sorteosSrv
      .listar()
      .pipe(catchError(() => of([] as Sorteo[])))
      .subscribe(
        (lista: Sorteo[]) => {
          // Calcular vendidos/disponibles para sorteos con billetes embebidos
          const preliminares: SorteoUI[] = (lista ?? []).map((s) => {
            const cont = this.contar(s as any);
            return { ...(s as Sorteo), vendidos: cont.vendidos, disponibles: cont.disponibles };
          });

          // Ordenar: vigentes primero, luego finalizados por fecha
          this.sorteos = [...preliminares].sort((a, b) => {
            const ap = this.isPasado(a) ? 1 : 0;
            const bp = this.isPasado(b) ? 1 : 0;
            if (ap !== bp) return ap - bp;
            return new Date(a.fechaSorteo).getTime() - new Date(b.fechaSorteo).getTime();
          });

          // Obtener sorteos sin billetes embebidos o contadores nulos
          const aCompletar = this.sorteos.filter(
            (s) => !this.hasBilletesEmbebidos(s) || s.vendidos + s.disponibles === 0
          );

          if (aCompletar.length === 0) {
            this.cargandoSorteos = false;
            return;
          }

          // Consultar billetes por sorteo (en paralelo)
          const llamadas = aCompletar.map((s) =>
            this.sorteosSrv.billetesPorSorteo(s.id).pipe(
              map((bs: Billete[]) => ({ id: s.id, ...this.contar({ billetes: bs } as any) })),
              catchError(() => of({ id: s.id, vendidos: 0, disponibles: 0 }))
            )
          );

          forkJoin(llamadas).subscribe((resumenes) => {
            const mapa = new Map(resumenes.map((r) => [r.id, r]));
            this.sorteos = this.sorteos.map((s) => {
              const r = mapa.get(s.id);
              return r ? { ...s, vendidos: r.vendidos, disponibles: r.disponibles } : s;
            });
            this.cargandoSorteos = false;
          });
        },
        () => (this.cargandoSorteos = false)
      );
  }

  /** True si la fecha del sorteo ya pasó */
  isPasado(s: { fechaSorteo: string | Date }): boolean {
    const d = new Date(s.fechaSorteo);
    d.setHours(0, 0, 0, 0);
    return d < this.todayStart;
  }

  /** ==========================================================
   *  NAVEGACIÓN Y DETALLE DE COMPRAS
   * ========================================================== */

  /** Navega a la vista de venta si el sorteo sigue vigente */
  irAVenta(sorteoId: number): void {
    if (!sorteoId) return;
    const s = this.sorteos.find((x) => x.id === sorteoId);
    if (s && this.isPasado(s)) {
      this.createMsg = 'Este sorteo ya finalizó. No es posible vender boletas.';
      return;
    }
    this.router.navigate(['/venta', sorteoId]);
  }

  /** Abre el modal de detalle para sorteos finalizados */
  abrirDetalleFinalizado(s: SorteoUI): void {
    if (!this.isPasado(s)) return;
    this.detalleSorteo = s;
    this.detalleAbierto = true;

    // Inicializar estado si no existe
    const estado = this.comprasBySorteo[s.id];
    if (!estado) {
      this.comprasBySorteo[s.id] = { loading: false, open: true, items: [], total: 0, error: null };
    }
    // Cargar datos si aún no hay items
    if (this.comprasBySorteo[s.id].items.length === 0) {
      this.cargarComprasSorteo(s.id);
    }
  }

  /** Cierra el modal */
  cerrarDetalle(): void {
    this.detalleAbierto = false;
    this.detalleSorteo = null;
  }

  /** Permite cerrar el modal presionando la tecla ESC */
  @HostListener('document:keydown.escape')
  onEsc() {
    if (this.detalleAbierto) this.cerrarDetalle();
  }

  /** ==========================================================
   *  CARGA DE COMPRAS (LISTADO DE BILLETES VENDIDOS)
   * ========================================================== */

  private cargarComprasSorteo(sorteoId: number): void {
    if (!sorteoId) return;

    // Inicializa estado local
    this.comprasBySorteo[sorteoId] = this.comprasBySorteo[sorteoId] ?? {
      loading: false, open: true, items: [], total: 0, error: null
    };
    this.comprasBySorteo[sorteoId].loading = true;
    this.comprasBySorteo[sorteoId].error = null;
    this.comprasBySorteo[sorteoId].items = [];
    this.comprasBySorteo[sorteoId].total = 0;

    // Carga de billetes vendidos usando el endpoint de billetes por sorteo
    this.sorteosSrv.billetesPorSorteo(sorteoId).pipe(
      catchError(() => of([] as Billete[]))
    ).subscribe({
      next: (billetes: Billete[]) => {
        // Filtra solo los billetes vendidos
        const vendidos = (billetes || []).filter((b: any) => b.estado === 'VENDIDO');

        // Mapea cada billete a un item de compra
        const items: CompraItem[] = vendidos.map((b: any) => ({
          clienteId: b.cliente?.id ?? 0,
          nombre: b.cliente?.nombre ?? '—',
          correo: b.cliente?.correo ?? null,
          numero: b.numero,
          precio: Number(b.precio ?? 0),
          fecha: b.fechaVenta ?? null,
        }));

        // Ordena: por fecha descendente, o por número si no hay fecha
        items.sort((a, b) => {
          if (a.fecha && b.fecha) return new Date(b.fecha).getTime() - new Date(a.fecha).getTime();
          return Number(a.numero) - Number(b.numero);
        });

        // Calcula total vendido
        const total = items.reduce((acc, it) => acc + Number(it.precio || 0), 0);

        // Actualiza estado local
        this.comprasBySorteo[sorteoId].items = items;
        this.comprasBySorteo[sorteoId].total = total;
        this.comprasBySorteo[sorteoId].loading = false;
      },
      error: () => {
        this.comprasBySorteo[sorteoId].loading = false;
        this.comprasBySorteo[sorteoId].error = 'No fue posible cargar las compras de este sorteo.';
      }
    });
  }

  /** Devuelve un estado de compras seguro (por defecto si no existe) */
  getEstado(id: number): ComprasEstado {
    return this.comprasBySorteo[id] ?? {
      loading: false,
      open: false,
      items: [],
      total: 0,
      error: null,
    };
  }

  /** ==========================================================
   *  UTILIDADES INTERNAS
   * ========================================================== */

  /** True si el sorteo contiene billetes embebidos */
  private hasBilletesEmbebidos(s: Partial<Sorteo>): boolean {
    return Array.isArray((s as any).billetes) && ((s as any).billetes as Billete[]).length > 0;
  }

  /** Calcula cantidad de billetes vendidos y disponibles */
  private contar(obj: Partial<Sorteo & { billetes?: Billete[] }>): {
    vendidos: number;
    disponibles: number;
  } {
    const billetes = (obj as any)?.billetes as Billete[] | undefined;
    const total = billetes?.length ?? 0;
    const vendidos = billetes?.filter((b) => b.estado === 'VENDIDO').length ?? 0;
    const disponibles = Math.max(total - vendidos, 0);
    return { vendidos, disponibles };
  }
}
