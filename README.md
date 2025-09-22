# Sistema Gestor de Tareas

Sistema Gestor de tareas, para uns institución educativa. Este sistema permite asignar tareas a los diferentes usuarios del sistema...

## Tabla de Contenidos
- [Instalación](#instalación)
- [Comandos](#comandos)
- [Uso](#uso)
- [Contribuciones](#contribuciones)
- [Licencia](#licencia)

## Instalación

Instrucciones para instalar:
```bash
# Instalar los modulos de node
npm install
```

```bash
# Crear el proyecto
ng new edu-task --routing --style=css
```

# Configuración de la Conexión a Firebase:

Ejecutamos el siguiente comando para agregar firebase al proyecto

```bash
npm install firebase @angular/fire@19.2.0

```
Y luego agregamos el environment

```bash
ng g environments

```

## Comandos

Estructura del Proyecto y Comando

```bash
# Servicios
ng g s core/services/firestore --skip-tests
ng g s core/services/auth --skip-tests
ng g s core/services/school --skip-tests
ng g s features/tasks/task --skip-tests

```

```bash
# Layout's
ng g c layout/navbar --skip-tests
ng g c layout/footer --skip-tests

```

```bash
# Guards
ng g guard core/guards/auth --skip-tests
ng g guard core/guards/admin --skip-tests
ng g guard core/guards/empleado --skip-tests

```

```bash
# Interfaces
ng g i core/interfaces/usuario --type=model
ng g i core/interfaces/escuela --type=model
ng g i core/interfaces/tarea --type=model

```
```bash
# Admin
ng g c features/admin/gestion-usuarios --skip-tests
ng g c features/admin/edit-usuario --skip-tests

# Schools
ng g c features/schools/school-list --skip-tests
ng g c features/schools/school-management --skip-tests

# Tasks
ng g component features/tasks/gestion-tareas --skip-tests
ng g component features/tasks/edit-tarea --skip-tests

# Employee
ng g component features/employee/mis-tareas --skip-tests
ng g component features/employee/detalle-tarea --skip-tests

# Public
ng g c features/auth/login --skip-tests
ng g c features/auth/register --skip-tests

# Perfil Usuario
ng g component features/auth/perfil --skip-tests


# Verificar Email
ng g component features/auth/verificar-email --skip-tests

# Olvidaste tu contraseña
ng g component features/auth/forgot-password --skip-tests

```

Instalación de Dependencias y Librerias:
 
```bash
# Descargar Tailwind
npm install tailwindcss @tailwindcss/postcss postcss --force

# Descargar Sweet Alert 2
npm install sweetalert2 
```
**Nota:**  Crear un archivo en la raiz ".postcssrc.json" y pega el siguiente código
```
{
  "plugins": {
    "@tailwindcss/postcss": {}
  }
}

```

```bash
```
Instalar preline para el uso de componentes reutilizables en Tailwind
```
npm i preline
npm install -D @tailwindcss/forms

# Incluir Preline en tu archivo styles.css

@import "tailwindcss";

@import "preline/variants.css";
@source "../node_modules/preline/dist/*.js";

```
Crea este archivo en la carpeta raiz de tu proyecto src `global.d.ts` ruta: `projects_root_directory/src/global.d.ts`
Pega el siguiente texto
```
import type { IStaticMethods } from "preline/dist";

declare global {
  interface Window {
    // Optional third-party libraries
    _;
    $: typeof import("jquery");
    jQuery: typeof import("jquery");
    DataTable;
    Dropzone;
    VanillaCalendarPro;

    // Preline UI
    HSStaticMethods: IStaticMethods;
  }
}

export {};

# Agrega el JS de Preline en tu `projects_root_directory/angular.json`

# // Optional third-party libraries
"node_modules/jquery/dist/jquery.min.js",
"node_modules/lodash/lodash.min.js",
"node_modules/dropzone/dist/dropzone-min.js",
"node_modules/nouislider/dist/nouislider.min.js",
"node_modules/datatables.net/js/dataTables.min.js",
"node_modules/vanilla-calendar-pro/index.js",

# // Preline UI
"node_modules/preline/dist/index.js"
```
Agrega código que reinicialice los componentes cada vez que se actualice la página en la aplicación `projects_root_directory/src/app/app.component.ts`
```
import { Router, Event, NavigationEnd } from '@angular/router';

@Component({
  ...
})

export class AppComponent {
  constructor(private router: Router) {
    ...
  }

  ngOnInit() {
    this.router.events.subscribe((event: Event) => {
      if (event instanceof NavigationEnd) {
        setTimeout(() => window.HSStaticMethods.autoInit(), 100);
      }
    });
  }
}
```
**Nota:** Para mas informacion de como instalar Preline.co para Angular 
          Te recomiendo que visites esta pagina
          [Preline With Angular](https://preline.co/docs/frameworks-angular.html)
```
