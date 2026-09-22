# IET BI Portal Frontend

Prototipo funcional local del portal institucional construido con Angular 22. Permite iniciar sesión por rol, administrar registros, guardar evaluaciones y ausentismo, gestionar monografías y consultar o imprimir reportes. Los datos se conservan en `localStorage`; no existe backend ni seguridad productiva.

## Desarrollo

```bash
npm start
```

Abra `http://localhost:4200/`. La navegación Angular se mantiene para recorrer tablero, estudiantes, monografías, detalles y reportes.

## Roles de demostración

El inicio de sesión requiere usuario y contraseña no vacíos y permite seleccionar un rol. La sesión se conserva localmente hasta cerrar sesión. Los guards restringen las rutas según el rol, pero esta validación ocurre únicamente en el navegador.

Los roles disponibles son Administrador, Profesor regular, Profesor Guía y Profesor Coordinador de Monografía. El Profesor Guía y el Profesor Coordinador conservan las funciones docentes del Profesor regular y agregan, respectivamente, las funciones de sección guía y de monografía. El menú lateral y el tablero cambian según el rol seleccionado.

## Compilación y pruebas

```bash
npm run build
npm test
git diff --check
```
