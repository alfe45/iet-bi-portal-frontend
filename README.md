# IET BI Portal Frontend

Frontend institucional construido con Angular 22. Consume la API del portal para autenticacion, administracion academica, matriculas, asignaciones, evaluaciones, ausentismo, monografias y reportes.

## Requisitos

- Node.js compatible con Angular 22.
- npm.
- Backend del portal disponible.

## Desarrollo

Inicie el backend y luego ejecute:

```bash
npm install
npm start
```

La aplicacion queda disponible en `http://localhost:4200/` y usa la configuracion de `src/env/environment.development.ts`. La URL base de la API se define en `apiUrl`.

## Configuracion por ambiente

- `src/env/environment.ts`: configuracion base.
- `src/env/environment.development.ts`: desarrollo local.
- `src/env/environment.production.ts`: compilacion de produccion.

Angular selecciona el archivo mediante los reemplazos definidos en `angular.json`. No se deben guardar secretos en estos archivos porque forman parte del frontend publicado.

## Compilacion y pruebas

```bash
npm run build -- --configuration development
npm run build -- --configuration production
npm test -- --watch=false
git diff --check
```

La compilacion de produccion genera los archivos en `dist/iet_bi_frontend`.

## Roles

El backend determina los roles y permisos de la sesion. La interfaz adapta el menu y las rutas para Administrador, Profesor regular, Profesor Guia, Profesor CAS, Coordinador CAS y Coordinador de Monografia.
