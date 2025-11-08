// src/app/features/clientes/cliente-form/cliente-form.component.ts
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ClientesService } from '../../../services/clientes.service';

@Component({
  selector: 'app-cliente-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './cliente-form.component.html',
  styleUrls: ['./cliente-form.component.scss'],
})
export class ClienteFormComponent {
  private fb = inject(FormBuilder);
  private clientes = inject(ClientesService);

  loading = false;
  msg: { type: 'ok' | 'error'; text: string } | null = null;

  form = this.fb.nonNullable.group({
    nombre: ['', [Validators.required, Validators.minLength(3)]],
    correo: ['', [Validators.required, Validators.email]],
  });

  get f() {
    return this.form.controls;
  }

  onSubmit() {
    this.msg = null;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading = true;

    this.clientes.crear(this.form.getRawValue()).subscribe({
      next: (res) => {
        this.msg = { type: 'ok', text: `Cliente registrado (#${res.id}).` };
        this.form.reset();
      },
      error: (err) => {
        const detail = err?.error?.message || 'No se pudo registrar el cliente.';
        this.msg = { type: 'error', text: detail };
      },
      complete: () => (this.loading = false),
    });
  }
}
