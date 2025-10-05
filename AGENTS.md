# Repository Guidelines

## Funcionalidad del Proyecto
- La ruta principal (src/pages/Index.tsx) conmuta entre login, dashboard administrativo y panel de ventas segun el rol elegido.
- LoginScreen permite seleccionar rol, capturar credenciales y administra inicio de sesion o registro usando Convex como backend.
- Dashboard ofrece metricas en tiempo real, graficos con Recharts y acceso a la gestion de operadores mediante TourOperatorsView.
- SalesView registra reservas, sugiere el operador con mejor disponibilidad y muestra una vista de capacidad por operador.
- AddTourOperatorForm centraliza altas y ediciones de operadores, actualizando flotillas, horarios y datos de contacto.

## Configuracion de Datos
- La aplicacion usa Convex (convex/, src/lib/operators.ts) para sesiones, operadores y reservas; ya no depende de almacenamiento local ni Supabase.
- Las cuentas semilla se generan automaticamente desde las funciones de Convex (admin@aquareservas.com / admin123 y ventas@aquareservas.com / ventas123).
- Solo es necesaria la variable VITE_CONVEX_URL apuntando al deployment de Convex; opciones como CONVEX_DEPLOYMENT permiten seleccionar dev/prod.

### Esquema de Convex
- **users**: email, passwordHash, role (admin | seller), createdAt, updatedAt (opcional).
- **sessions**: userId (ref a users), token, createdAt, expiresAt.
- **operators**: nombre, contacto {telefono, email, direccion}, botes[{nombre, capacidad, estado, tipo}], personal, capacidadTotal, horarios[], especialidad, createdAt, updatedAt.
- **reservations**: operadorId (ref a operators), personas, tipo, timestamp, horaSalida, dayKey.

### Funciones principales
- `convex/auth.ts`: signUp/signIn/signOut/getSession usando Web Crypto para hash y sesiones.
- `convex/operators.ts`: getBundle (consulta operadores + reservas del día), saveOperator, removeOperator y createReservation.
- Hooks (`src/hooks/useOperatorsData.ts`) y auth (`src/lib/auth.ts`) consumen Convex en tiempo real via Convex React client.

## Project Structure & Module Organization
- src/pages hosts route-level views; Index.tsx orchestrates auth flows and dashboard switching.
- src/components contiene UI reutilizable basada en shadcn, agrupada por dominio; crea carpetas cuando un modulo supera tres archivos.
- src/hooks y src/lib guardan logica compartida; centraliza reglas de negocio ahi para evitar duplicidad en componentes.
- src/assets almacena media estatica, mientras public sirve archivos copiados al build.
- El alias de ruta @/ resuelve a src; mantén la configuracion de Vite y Tailwind en la raiz (tailwind.config.ts, vite.config.ts).

## Build, Test, and Development Commands
- npm run dev levanta el servidor de desarrollo de Vite con Convex en tiempo real (necesitas `npx convex dev` en otra terminal si apuntas a un backend local).
- npm run build genera el bundle optimizado en dist listo para despliegue.
- npm run build:dev construye en modo desarrollo para depurar el bundle localmente.
- npm run preview sirve el contenido de dist; úsalo para validar la salida de producción.
- npm run lint ejecuta ESLint (TypeScript + React Hooks). Resuelve advertencias antes de abrir un PR.

## Coding Style & Naming Conventions
- Usa TypeScript en todo el codigo; prefiere props explicitas y tipos union para los flujos admin vs seller.
- Componentes en PascalCase, hooks en camelCase con prefijo use, utilidades en lib.
- Indentacion de 2 espacios, comillas simples en TSX y agrupa imports por origen (externo, @/, relativo).
- Utiliza utilidades Tailwind directamente en JSX; para listas largas de clases usa el helper cn en src/lib/utils.

## Testing Guidelines
- Aun no hay pruebas automatizadas; introduce Vitest + Testing Library con nuevas funcionalidades.
- Ubica los tests como *.test.tsx junto al componente o en un directorio __tests__ si el escenario es complejo.
- Cubre tanto analytics del dashboard admin como flujos de reservas en ventas con fixtures realistas.
- Siempre realiza una prueba rapida con npm run dev para login, widgets del dashboard y captura de ventas antes de subir cambios.

## Commit & Pull Request Guidelines
- Sigue commits concisos en imperativo (feat: add capacity widget, refactor: simplify login state). Mantén el alcance acotado.
- Referencia issues relacionados, prompts de Lovable o enlaces de contexto en el cuerpo cuando aplique.
- Los PR deben incluir resumen, capturas antes/despues para ajustes UI y anotar cambios de config/env.
- Ejecuta lint y build (npm run build & npm run preview) antes de solicitar revision.

