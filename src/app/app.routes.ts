// ============================================================
// Archivo: src/app/app.routes.ts
// Descripción:
// Define todas las rutas principales de la aplicación del
// sistema de lotería, utilizando lazy loading para cada componente.
// ============================================================

import { Routes } from '@angular/router';

export const routes: Routes = [
  // ============================================================
  // Ruta raíz (inicio)
  // ------------------------------------------------------------
  // Redirige automáticamente al módulo de sorteos cuando el usuario
  // accede al dominio raíz (/). Usa pathMatch:'full' para asegurar
  // que la redirección se aplique solo si la ruta está completamente vacía.
  // ============================================================
  { path: '', redirectTo: 'sorteos', pathMatch: 'full' },

  // ============================================================
  // Listado y gestión de sorteos
  // ------------------------------------------------------------
  // Carga el componente principal de sorteos que muestra todos los
  // sorteos registrados en el sistema, con la posibilidad de ver,
  // crear o acceder a la venta de boletas.
  // ============================================================
  {
    path: 'sorteos',
    loadComponent: () =>
      import('./features/sorteos/sorteos/sorteos.component').then(
        (m) => m.SorteosComponent
      ),
  },

  // ============================================================
  // Venta de boletas por sorteo específico
  // ------------------------------------------------------------
  // Permite realizar la venta de boletas para un sorteo determinado.
  // El parámetro :id corresponde al ID del sorteo seleccionado.
  // Ejemplo de URL: /venta/3 (abre la venta del sorteo con ID = 3).
  // ============================================================
  {
    path: 'venta/:id',
    loadComponent: () =>
      import('./features/sorteos/venta-boleta/venta-boleta.component').then(
        (m) => m.VentaBoletaComponent
      ),
  },

  // ============================================================
  // Venta de boletas sin sorteo preseleccionado
  // ------------------------------------------------------------
  // Permite acceder al formulario de venta sin haber elegido un
  // sorteo previamente. El usuario podrá seleccionar el sorteo dentro
  // del propio formulario.
  // ============================================================
  {
    path: 'venta',
    loadComponent: () =>
      import('./features/sorteos/venta-boleta/venta-boleta.component').then(
        (m) => m.VentaBoletaComponent
      ),
  },

  // ============================================================
  // Registro de clientes
  // ------------------------------------------------------------
  // Muestra el formulario de registro de nuevos clientes.
  // Incluye validaciones básicas en los campos (nombre y correo).
  // ============================================================
  {
    path: 'clientes/registrar',
    loadComponent: () =>
      import('./features/clientes/cliente-form/cliente-form.component').then(
        (m) => m.ClienteFormComponent
      ),
  },

  // ============================================================
  // Historial de billetes vendidos por cliente
  // ------------------------------------------------------------
  // Permite consultar las boletas compradas por un cliente específico,
  // buscando por su correo electrónico. Útil para verificar compras
  // anteriores o participación en sorteos.
  // ============================================================
  {
    path: 'historial',
    loadComponent: () =>
      import('./features/historial/historial-cliente/historial-cliente.component').then(
        (m) => m.HistorialClienteComponent
      ),
  },

  // ============================================================
  // Ruta comodín (fallback)
  // ------------------------------------------------------------
  // Cubre cualquier ruta no reconocida y redirige a la vista principal
  // de sorteos para evitar errores de navegación o páginas en blanco.
  // ============================================================
  { path: '**', redirectTo: 'sorteos' },
];
