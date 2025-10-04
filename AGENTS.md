# Repository Guidelines

## Funcionalidad del Proyecto
- La ruta principal (src/pages/Index.tsx) conmuta entre login, dashboard administrativo y panel de ventas segun el rol elegido.
- LoginScreen permite seleccionar rol, capturar credenciales y administra inicio de sesion o registro usando almacenamiento local.
- Dashboard ofrece metricas en tiempo real, graficos con Recharts y acceso a la gestion de operadores mediante TourOperatorsView.
- SalesView registra reservas, sugiere el operador con mejor disponibilidad y muestra una vista de capacidad por operador.
- AddTourOperatorForm centraliza altas y ediciones de operadores, actualizando flotillas, horarios y datos de contacto.

## Configuracion de Datos
- La aplicacion usa almacenamiento local del navegador para sesiones, operadores y reservas; no depende de servicios externos.
- Las cuentas semilla son admin@aquareservas.com (admin123) y ventas@aquareservas.com (ventas123).
- No se requieren variables VITE_SUPABASE_URL ni claves de terceros para ejecutar el proyecto.

## Project Structure & Module Organization
- src/pages hosts route-level views; Index.tsx orchestrates auth flows and dashboard switching.
- src/components contiene UI reutilizable basada en shadcn, agrupada por dominio; crea carpetas cuando un modulo supera tres archivos.
- src/hooks y src/lib guardan logica compartida; centraliza reglas de negocio ahi para evitar duplicidad en componentes.
- src/assets almacena media estatica, mientras public sirve archivos copiados al build.
- El alias de ruta @/ resuelve a src; mantén la configuracion de Vite y Tailwind en la raiz (tailwind.config.ts, vite.config.ts).

## Build, Test, and Development Commands
- npm run dev levanta el servidor de desarrollo de Vite (http://localhost:5173) con recarga en caliente.
- npm run build genera el bundle optimizado en dist listo para despliegue.
- npm run build:dev construye en modo desarrollo para depurar el bundle localmente.
- npm run preview sirve el contenido de dist; usalo para validar la salida de produccion.
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
