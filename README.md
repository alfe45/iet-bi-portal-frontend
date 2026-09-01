# IET BI Portal Frontend

Prototipo visual del portal institucional construido con Angular 22. Las pantallas muestran datos de ejemplo definidos directamente en cada vista: no existe backend, capa de datos ni validación de credenciales.

## Desarrollo

```bash
npm start
```

Abra `http://localhost:4200/`. La navegación Angular se mantiene para recorrer tablero, estudiantes, monografías, detalles y reportes.

## Roles de demostración

El inicio de sesión solo permite seleccionar un rol. Usuario y contraseña son campos visuales y no se validan. El rol se conserva únicamente en `AutenticacionService`, que limpia el estado al cerrar sesión y navega a `/login`.

Los roles disponibles son Administrador, Profesor regular, Profesor Guía y Coordinador de monografía. El menú lateral y el tablero cambian según el rol seleccionado.

## Compilación y pruebas

```bash
npm run build
npm test
git diff --check
```
