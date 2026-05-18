import type { TourStep } from './types'

const onEventsList = (p: string) => p === '/events'
const onEventWorkspace = (p: string) => /^\/events\/[^/]+\/.+/.test(p)

export const TOUR_TOTAL = 6

export const tourSteps: TourStep[] = [
  {
    id: 'new-event-btn',
    target: '[data-tour="new-event-btn"]',
    title: 'Creá tu primer evento',
    content: 'Tocá este botón para empezar. Poné el nombre del evento y guardalo.',
    placement: 'bottom',
    hint: 'Andá a Mis eventos para continuar el tour.',
    matchPath: onEventsList,
  },
  {
    id: 'events-list',
    target: '[data-tour="events-list"]',
    title: 'Tus eventos',
    content: 'Tus eventos aparecen acá. Tocá uno para abrir su panel y continuar el tour.',
    placement: 'top',
    hint: 'Andá a Mis eventos para continuar el tour.',
    matchPath: onEventsList,
  },
  {
    id: 'sidebar-catalog',
    target: '[data-tour="sidebar-catalog"]',
    title: 'Catálogo',
    content: 'Acá agregás tus productos con nombre, precio y foto. También podés crear combos.',
    placement: 'right',
    hint: 'Abrí un evento para continuar el tour.',
    matchPath: onEventWorkspace,
  },
  {
    id: 'sidebar-orders',
    target: '[data-tour="sidebar-orders"]',
    title: 'Pedidos',
    content: 'Los pedidos de tus clientes aparecen acá en tiempo real, con el estado de cada uno.',
    placement: 'right',
    hint: 'Abrí un evento para continuar el tour.',
    matchPath: onEventWorkspace,
  },
  {
    id: 'sidebar-scanner',
    target: '[data-tour="sidebar-scanner"]',
    title: 'Escáner QR',
    content: 'Escaneá el código QR del cliente para marcar el pedido como listo al instante.',
    placement: 'right',
    hint: 'Abrí un evento para continuar el tour.',
    matchPath: onEventWorkspace,
  },
  {
    id: 'sidebar-config',
    target: '[data-tour="sidebar-config"]',
    title: 'Configuración',
    content: 'Conectá tu propia cuenta de Mercado Pago para recibir los pagos directo.',
    placement: 'right',
    hint: 'Abrí un evento para continuar el tour.',
    matchPath: onEventWorkspace,
  },
]
