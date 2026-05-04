# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Comandos frecuentes

```bash
npm run dev        # servidor de desarrollo (puerto 3000)
npm run build      # build de producción
npm run lint       # ESLint
npm run test       # Jest (todos los tests)
npm run test:watch # Jest en modo watch
```

Para correr un solo test:
```bash
npx jest __tests__/components/buyer/CartView.test.tsx
```

## Variables de entorno

| Variable | Propósito |
|---|---|
| `NEXT_PUBLIC_API_URL` | URL base del backend Flask (ej. `http://127.0.0.1:5001`). Si está vacía, se usa el proxy de Next `/api/backend/*`. |
| `NEXT_PUBLIC_SITE_URL` | URL canónica del sitio para `metadataBase`. Si está vacía, se intenta `VERCEL_URL`. |

## Arquitectura

### Route groups (App Router)

- **`app/(buyer)/[eventId]/`** — flujo comprador: catálogo, carrito, checkout, seguimiento de orden, QR de retiro. No requiere autenticación.
- **`app/(organizer)/`** — panel del organizador: eventos, pedidos, productos, categorías, puntos de retiro, scanner, pagos. Protegido por `OrganizerGuard`.
- **`app/page.tsx`** — login (página raíz).

### Autenticación

`OrganizerGuard` (`components/organizer/OrganizerGuard.tsx`) envuelve todo `(organizer)/` layout. Verifica el token en `localStorage` contra `GET /api/auth/me` al montar y redirige a `/` si es inválido. El token y el usuario se persisten con `lib/authSession.ts` (`nubapay_token` / `nubapay_user`).

### Comunicación con el backend

- `lib/api.ts` → `getApiOrigin()` / `apiUrl()`: construyen la URL completa dependiendo de si `NEXT_PUBLIC_API_URL` está seteada.
- `lib/api/paths.ts`: centraliza todas las rutas HTTP (`systemPaths`, `authPaths`, `eventsPaths`).
- `lib/organizerWorkspace.ts`: funciones de data-fetching del workspace del organizador (productos, categorías, pedidos, pagos, puntos de retiro, dashboard). Todas retornan `{ ok: true, data }` o `{ ok: false, error }`.
- El proxy de Next.js (`next.config.ts`) redirige `/api/backend/*` → `NEXT_PUBLIC_API_URL/api/*` para evitar CORS en desarrollo.

### Patrón `browserFetch`

`lib/browserFetch.ts` es un thin wrapper sobre `fetch` que existe exclusivamente para permitir mocks en Jest/jsdom. Siempre usar `browserFetch` en lugar de `fetch` directo en componentes y funciones que necesiten ser testeadas.

### Componentes UI

`components/ui/` contiene primitivos reutilizables (`Button`, `Badge`, `Card`, `Modal`, `Spinner`, `PaginationBar`). Se exportan desde `components/ui/index.ts`.

Usar `cn()` de `lib/utils.ts` (wrapper de `clsx` + `tailwind-merge`) para componer clases de Tailwind.

### Tests

Los tests están en `__tests__/` replicando la estructura de `components/` y `lib/`. Jest está configurado con `jsdom` y el alias `@/` apunta a la raíz del proyecto.
