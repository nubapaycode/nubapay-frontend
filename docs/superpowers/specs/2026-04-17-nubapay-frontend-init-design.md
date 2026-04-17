# Nubapay Frontend — Diseño inicial

**Fecha:** 2026-04-17  
**Stack:** Next.js 15 (App Router) · TypeScript · Tailwind CSS · npm

---

## Contexto

Nubapay es una plataforma web para eventos masivos que permite a asistentes pedir productos desde el celular, pagar sin fila, seguir su pedido en tiempo real y retirar con QR único antifraude. El frontend cubre dos contextos: el flujo del comprador (público, mobile-first) y el panel del organizador (desktop-friendly).

---

## Arquitectura

Monorepo único con Next.js App Router usando route groups para separar buyer y organizer:

```
nubapay-frontend/
├── app/
│   ├── (buyer)/
│   │   └── [eventId]/
│   │       ├── page.tsx               # Catálogo
│   │       ├── cart/page.tsx          # Carrito
│   │       ├── checkout/page.tsx      # Checkout
│   │       ├── order/[orderId]/page.tsx   # Seguimiento del pedido
│   │       └── qr/[orderId]/page.tsx      # QR de retiro
│   ├── (organizer)/
│   │   ├── dashboard/page.tsx
│   │   ├── orders/page.tsx
│   │   └── products/page.tsx
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── buyer/
│   ├── organizer/
│   └── ui/                            # Primitivas compartidas
├── lib/
└── types/
```

**Decisión:** un solo proyecto para facilitar deploys unificados y compartir código sin overhead de monorepo.

---

## Flujos y páginas

### Flujo del comprador (`/(buyer)/[eventId]/`)

| Ruta | Descripción |
|---|---|
| `/[eventId]` | Catálogo de productos y combos del evento |
| `/[eventId]/cart` | Carrito con resumen y ajuste de cantidades |
| `/[eventId]/checkout` | Datos y pago |
| `/[eventId]/order/[orderId]` | Seguimiento en tiempo real: preparando → listo → retirado |
| `/[eventId]/qr/[orderId]` | QR único antifraude para retiro |

### Panel del organizador (`/(organizer)/`)

| Ruta | Descripción |
|---|---|
| `/organizer/dashboard` | Resumen en tiempo real: pedidos activos, ingresos, puntos de entrega |
| `/organizer/orders` | Lista de pedidos con estados, marcar listo/entregado |
| `/organizer/products` | CRUD de productos y combos |

---

## Componentes compartidos

**`components/ui/`:** `Button`, `Card`, `Badge`, `Spinner`, `Modal`

**`types/`:** `Event`, `Product`, `Order`, `OrderStatus`, `QRToken`

**`lib/`:** `formatPrice`, `formatDate`, `fetcher`

---

## Decisiones técnicas

- **Estado del carrito:** `localStorage` + estado local de React. Sin Zustand/Redux en el MVP.
- **Tiempo real:** polling simple con `useEffect` + `setInterval`. Sin WebSockets por ahora.
- **Auth:** no incluida en esta fase. El flujo del comprador es público; el panel del organizador se protegerá en una fase posterior.
- **Estilos:** Tailwind CSS, mobile-first. El buyer es 100% mobile; el organizer puede ser desktop.
- **Convenciones:** código en inglés, copy visible al usuario en español.

---

## Fuera de alcance (esta fase)

- Autenticación y roles
- Integración de pagos real
- Chat con Atendium (IA)
- Notificaciones push / WhatsApp
- Analytics post-evento
- Pedidos grupales
