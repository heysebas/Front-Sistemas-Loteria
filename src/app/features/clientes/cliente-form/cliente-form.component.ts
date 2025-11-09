// src/app/features/clientes/cliente-form/cliente-form.component.ts
import { Component, inject } from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
  AbstractControl,
  ValidationErrors,
  AsyncValidatorFn,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { firstValueFrom, of } from 'rxjs';
import { catchError, debounceTime, distinctUntilChanged, map, switchMap, take } from 'rxjs/operators';
import Swal from 'sweetalert2';

import { ClientesService } from '../../../services/clientes.service';

/**
 * Formulario para registrar nuevos clientes.
 *
 * Funcionalidades:
 * - Valida campos requeridos (nombre, correo).
 * - Verifica de forma asíncrona si el correo ya existe en el sistema.
 * - Envía los datos al backend mediante ClientesService.
 * - Muestra alertas visuales de éxito o error.
 */
@Component({
  selector: 'app-cliente-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './cliente-form.component.html',
  styleUrls: ['./cliente-form.component.scss'],
})
export class ClienteFormComponent {
  /** Inyección de dependencias principales. */
  private fb = inject(FormBuilder);
  private clientes = inject(ClientesService);

  /** Estado general del formulario y mensajes. */
  loading = false;
  msg: { type: 'ok' | 'error'; text: string } | null = null;

  /**
   * Validador asíncrono que consulta si el correo ya está registrado.
   *
   * Se ejecuta al perder el foco (updateOn: 'blur').
   * Si el campo está vacío o tiene formato inválido, no realiza petición.
   */
  private emailExisteValidator(): AsyncValidatorFn {
    return (control: AbstractControl) => {
      if (!control.value || control.hasError('email')) return of(null);

      return of(control.value).pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap((correo: string) =>
          this.clientes.existeCorreo
            ? this.clientes.existeCorreo(correo).pipe(
              map((existe: boolean) => (existe ? { emailTomado: true } as ValidationErrors : null)),
              catchError(() => of(null)),
              take(1)
            )
            : of(null)
        )
      );
    };
  }

  /** Definición del formulario reactivo. */
  form = this.fb.nonNullable.group({
    nombre: ['', [Validators.required, Validators.minLength(3)]],
    correo: this.fb.nonNullable.control(
      '',
      {
        validators: [Validators.required, Validators.email],
        asyncValidators: [this.emailExisteValidator()],
        updateOn: 'blur',
      }
    ),
  });

  /** Acceso rápido a los controles del formulario. */
  get f() {
    return this.form.controls;
  }

  /**
   * Envía el formulario al backend para registrar un nuevo cliente.
   *
   * Validaciones previas:
   * - Verifica que el formulario sea válido.
   * - Reconfirma si el correo no está repetido antes de crear.
   *
   * Muestra alertas de éxito o error según la respuesta.
   */
  async onSubmit() {
    this.msg = null;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    // Verificación adicional de correo duplicado
    if (this.clientes.existeCorreo) {
      try {
        const yaExiste = await firstValueFrom(
          this.clientes.existeCorreo(this.f.correo.value).pipe(catchError(() => of(false)))
        );
        if (yaExiste) {
          this.f.correo.setErrors({ emailTomado: true });
          Swal.fire({
            title: 'Correo ya registrado',
            text: 'El correo ingresado ya existe en el sistema.',
            icon: 'warning',
            confirmButtonText: 'Entendido',
          });
          return;
        }
      } catch {
        // Si la validación remota falla, continúa con precaución.
      }
    }

    this.loading = true;

    this.clientes.crear(this.form.getRawValue()).subscribe({
      next: (res) => {
        this.msg = { type: 'ok', text: `Cliente registrado (#${res.id}).` };
        Swal.fire({
          title: 'Cliente creado',
          text: `Cliente registrado correctamente (ID #${res.id}).`,
          icon: 'success',
          confirmButtonText: 'Perfecto',
        });
        this.form.reset();
      },
      error: (err) => {
        const detail = err?.error?.message || 'No se pudo registrar el cliente.';
        this.msg = { type: 'error', text: detail };

        const yaExiste = typeof detail === 'string' && /correo.*(existe|registrado|duplicado)/i.test(detail);
        Swal.fire({
          title: yaExiste ? 'Correo ya registrado' : 'Error',
          text: yaExiste ? 'El correo ingresado ya existe en el sistema.' : detail,
          icon: yaExiste ? 'warning' : 'error',
          confirmButtonText: 'Cerrar',
        });

        if (yaExiste) {
          this.f.correo.setErrors({ emailTomado: true });
        }
      },
      complete: () => (this.loading = false),
    });
  }
}
