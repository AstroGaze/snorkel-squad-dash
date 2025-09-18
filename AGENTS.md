# Repository Guidelines

## Funcionalidad del Proyecto
- La ruta principal (src/pages/Index.tsx) conmuta entre login, dashboard administrativo y panel de ventas segun el rol elegido.
- LoginScreen permite seleccionar rol, capturar credenciales y administra inicio de sesion o registro contra Supabase.
- Dashboard ofrece metricas en tiempo real, graficos con Recharts y acceso a la gestion de operadores mediante TourOperatorsView.
- SalesView registra reservas, sugiere el operador con mejor disponibilidad y muestra una vista de capacidad por operador.
- AddTourOperatorForm centraliza altas y ediciones de operadores, actualizando flotillas, horarios y datos de contacto.

## Configuracion de Backend
- Define VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en .env (usa .env.example como base) antes de ejecutar 
pm run dev.
- Supabase maneja email/password; el rol se guarda en user_metadata.role con valores dmin o seller para enrutar after login.
- Ajusta politicas de confirmacion y recuperacion en Supabase Auth -> Settings segun el flujo deseado.
- Si migras usuarios previos, aseguralos con el metadata correcto mediante la UI o scripts de Supabase.

## Project Structure & Module Organization
- src/pages hosts route-level views; Index.tsx orchestrates auth flows and dashboard switching.
- src/components contains reusable shadcn-based UI grouped by domain; create folders when a module exceeds three files.
- src/hooks and src/lib hold shared logic/utilities; prefer colocating business rules there over duplicating in components.
- src/assets stores static media, while public serves raw files copied to the build.
- Path alias @/ resolves to src; keep Vite and Tailwind config in the root (	ailwind.config.ts, ite.config.ts).

## Build, Test, and Development Commands
- 
pm run dev boots the Vite dev server (default http://localhost:5173) with hot reload.
- 
pm run build produces an optimized bundle in dist for deployment.
- 
pm run build:dev builds in development mode when debugging bundle issues locally.
- 
pm run preview serves the contents of dist; run this to sanity-check production output.
- 
pm run lint executes ESLint (TypeScript + React Hooks). Resolve warnings before opening a PR.

## Coding Style & Naming Conventions
- Use TypeScript everywhere; prefer explicit prop interfaces and union types for admin vs seller flows.
- Components are PascalCase (DashboardHeader), hooks are camelCase with use prefix, utility modules stay in lib.
- Default to 2-space indentation, single quotes in TSX, and group imports by origin (external, @/, relative).
- Tailwind utilities live on JSX nodes; compose long class lists with the cn helper in src/lib/utils.

## Testing Guidelines
- Automated tests are not yet wired; introduce Vitest + Testing Library alongside new features.
- Co-locate specs as *.test.tsx beside components or in a __tests__ folder when scenarios are complex.
- Cover both admin dashboard analytics and seller booking flows with realistic snorkel tour fixtures.
- Always smoke-test 
pm run dev for login, dashboard widgets, and sales entry before submitting changes.

## Commit & Pull Request Guidelines
- Follow concise, imperative commits (feat: add capacity widget, 
efactor: simplify login state). Keep changes scoped.
- Reference related issues, Lovable prompts, or context links in the body when applicable.
- Pull requests need a summary, before/after visuals for UI adjustments, and noted env/config updates.
- Confirm lint passes and preview build (
pm run build & 
pm run preview) before requesting review.

