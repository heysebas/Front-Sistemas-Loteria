import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'sorteos', pathMatch: 'full' },
  {
    path: 'sorteos',
    loadComponent: () =>
      import('./features/sorteos/sorteos/sorteos.component').then(
        (m) => m.SorteosComponent
      ),
  },
  {
    path: 'clientes/registrar',
    loadComponent: () =>
      import('./features/clientes/cliente-form/cliente-form.component').then(
        (m) => m.ClienteFormComponent
      ),
  },
  {
    path: 'historial',
    loadComponent: () =>
      import('./features/historial/historial-cliente/historial-cliente.component').then(
        (m) => m.HistorialClienteComponent
      ),
  },
  { path: '**', redirectTo: 'sorteos' },
];
