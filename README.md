# 🎨 Front-Sistemas-Lotería — Aplicación Angular

Interfaz web desarrollada en **Angular** para consumir la API REST del proyecto **Sistema de Ventas de Lotería**.  
Permite gestionar la venta de billetes, consultar sorteos activos y visualizar el historial de clientes de forma sencilla y moderna.

---

## 🧩 Características principales

- Visualización de **sorteos activos** y billetes disponibles.  
- Registro de **ventas** en tiempo real conectado al backend (Spring Boot).  
- **Validaciones reactivas** de formularios.  
- Consulta del **historial de billetes vendidos por cliente**.  
- Arquitectura modular con componentes standalone.  
- Consumo de API REST con **HttpClient** (basado en `environment.apiUrl`).  
- Diseño adaptable con **SCSS** limpio y personalizable.

---

## 🗂️ Estructura del proyecto
```bash
src/
│ index.html
│ main.ts
│ styles.scss
│
└───app
│ app.component.html
│ app.component.scss
│ app.component.spec.ts
│ app.component.ts
│ app.config.ts
│ app.routes.ts
│
├───environments/
│ environment.ts
│
├───features/
│ ├───clientes/
│ │ └───cliente-form/
│ │ cliente-form.component.html
│ │ cliente-form.component.scss
│ │ cliente-form.component.ts
│ │
│ ├───historial/
│ │ └───historial-cliente/
│ │ historial-cliente.component.html
│ │ historial-cliente.component.scss
│ │ historial-cliente.component.ts
│ │
│ └───sorteos/
│ ├───sorteos/
│ │ sorteos.component.html
│ │ sorteos.component.scss
│ │ sorteos.component.ts
│ │
│ └───venta-boleta/
│ venta-boleta.component.html
│ venta-boleta.component.scss
│ venta-boleta.component.ts
│
├───models/
│ billete.ts
│ cliente.ts
│ sorteo.ts
│
└───services/
clientes.service.ts
sorteos.service.ts
ventas.service.ts



---

## ⚙️ Tecnologías utilizadas

| Categoría | Tecnología / Framework |
|------------|------------------------|
| Lenguaje | TypeScript |
| Framework | Angular 17+ |
| Estilos | SCSS |
| Librerías principales | Angular Router, Reactive Forms, HttpClient |
| Backend conectado | API REST — Spring Boot 3.4 |
| IDE recomendado | VS Code / WebStorm |

---

## 🚀 Ejecución del proyecto

### 🔧 Requisitos previos
- Node.js 18 o superior  
- Angular CLI 17+  
- Backend corriendo en `http://localhost:8080`

### ▶️ Iniciar aplicación

npm install
ng serve


Luego abre en el navegador:
http://localhost:4200

🌐 Configuración del entorno

src/app/environments/environment.ts
export const environment = {
  /** Modo de compilación (false = desarrollo). */
  production: false,

  /** URL base del backend API. */
  apiUrl: 'http://localhost:8080/api'
};



🧱 Estructura funcional
| Módulo                   | Funcionalidad                                                     |
| ------------------------ | ----------------------------------------------------------------- |
| **Sorteos**              | Muestra sorteos activos y billetes disponibles                    |
| **Venta de boletas**     | Permite seleccionar sorteo, cliente y registrar una venta         |
| **Clientes**             | Formulario de registro y validación de datos                      |
| **Historial de cliente** | Consulta el historial de billetes vendidos por correo electrónico |

📡 Comunicación con el backend
Todos los servicios (clientes.service.ts, sorteos.service.ts, ventas.service.ts) consumen la API REST del backend con rutas como:
| Acción                     | Método | Endpoint                                  |
| -------------------------- | ------ | ----------------------------------------- |
| Listar sorteos             | GET    | `/api/sorteos`                            |
| Listar billetes por sorteo | GET    | `/api/billetes/sorteo/{id}`               |
| Registrar venta            | POST   | `/api/ventas`                             |
| Historial por cliente      | GET    | `/api/clientes/historial?correo={correo}` |


🎨 Diseño y UX

Componentes standalone con Reactive Forms.

Diseño modular y reutilizable con SCSS.

Mensajes de validación y retroalimentación de errores del backend (GlobalExceptionHandler).

Interfaz limpia, responsive y minimalista, inspirada en dashboards modernos.

🧠 Buenas prácticas aplicadas

Arquitectura modular y escalable.

Separación de responsabilidades (componentes ↔ servicios ↔ modelos).

Uso de Observables y Reactive Forms.

Configuración centralizada de entorno (environment.ts).

Manejo de errores del backend mediante HttpErrorResponse.

Código tipado y documentado en TypeScript.

🏁 Estado del proyecto

✅ Completado y funcional.
Incluye:

Integración total con el backend

Validaciones reactivas

Flujo completo de venta e historial

Código modular y mantenible

Documentación lista para revisión técnica

👨‍💻 Autor

Johan Sebastian Grisales Montoya
Desarrollador
📅 Noviembre 2025
