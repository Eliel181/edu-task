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

```

```bash
# Interfaces
ng g i core/interfaces/usuario --type=model
```
```bash
# Admin
ng g c features/admin/gestion-usuarios --skip-tests
ng g c features/admin/edit-usuario --skip-tests

# Tasks
ng g component features/tasks/gestion-tareas --skip-tests
ng g component features/tasks/edit-tarea --skip-tests

# Public
ng g c features/auth/login --skip-tests
ng g c features/auth/register --skip-tests
```

# Instalación de Dependencias y Librerias:
 
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
