'use client'

import { BlocksView } from '@/components/organizer/BlocksView'
import { CourtesyView } from '@/components/organizer/CourtesyView'
import { MercadoPagoSetupView } from '@/components/organizer/MercadoPagoSetupView'
import { MobbexSetupView } from '@/components/organizer/MobbexSetupView'
import { OrdersView } from '@/components/organizer/OrdersView'
import { OrganizerToolHeading } from '@/components/organizer/OrganizerToolHeading'
import { PaymentMethodsView } from '@/components/organizer/PaymentMethodsView'
import { PaymentsView } from '@/components/organizer/PaymentsView'
import { ProductsView } from '@/components/organizer/ProductsView'
import { ScannerView } from '@/components/organizer/ScannerView'
import { SipagoSetupView } from '@/components/organizer/SipagoSetupView'
import { StaffView } from '@/components/organizer/StaffView'
import { TicketsView } from '@/components/organizer/TicketsView'
import { ParkingReservations } from '@/components/organizer/tickets/ParkingReservations'
import { useParkingOwnerAccount } from '@/components/parkingOwner/ParkingOwnerAccountContext'
import { getAuthUser } from '@/lib/authSession'
import { EventFilter, useEventScope } from '@/components/parkingOwner/EventScopePicker'
import { RequireModule } from '@/components/parkingOwner/RequireModule'

/**
 * Secciones de configuración del estacionamiento. Son las mismas vistas del panel de un evento, pero sobre
 * el evento base del estacionamiento: lo que se define acá lo heredan todos sus eventos.
 */

/** Pantallas de conexión de pasarelas del estacionamiento. */
export const PARKING_PAYMENTS_PATH = '/estacionamiento/cobros/metodos-pago'

export function VehiclesSection() {
  const { account } = useParkingOwnerAccount()
  return (
    <RequireModule module="parking">
      <TicketsView eventId={account.base_event_id} kind="parking" scope="account" />
    </RequireModule>
  )
}

export function StoreProductsSection() {
  const { account } = useParkingOwnerAccount()
  return (
    <RequireModule module="catalogo">
      <ProductsView eventId={account.base_event_id} />
    </RequireModule>
  )
}

export function StoreBlocksSection() {
  const { account } = useParkingOwnerAccount()
  return (
    <RequireModule module="catalogo">
      <BlocksView eventId={account.base_event_id} />
    </RequireModule>
  )
}

export function TeamSection() {
  const { account } = useParkingOwnerAccount()
  return <StaffView eventId={account.base_event_id} />
}

export function PaymentsSection() {
  const { account } = useParkingOwnerAccount()
  return <PaymentMethodsView eventId={account.base_event_id} basePath={PARKING_PAYMENTS_PATH} />
}

export function MercadoPagoSection() {
  const { account } = useParkingOwnerAccount()
  return <MercadoPagoSetupView eventId={account.base_event_id} backHref={PARKING_PAYMENTS_PATH} />
}

export function SipagoSection() {
  const { account } = useParkingOwnerAccount()
  return <SipagoSetupView eventId={account.base_event_id} backHref={PARKING_PAYMENTS_PATH} />
}

export function MobbexSection() {
  const { account } = useParkingOwnerAccount()
  return <MobbexSetupView eventId={account.base_event_id} backHref={PARKING_PAYMENTS_PATH} />
}

/*
 * Vistas de operación. Abiertas sobre el evento base muestran todo el estacionamiento (el backend expande el
 * base a todos sus eventos); el filtro "Evento" monta la misma pantalla sobre un solo evento.
 */

export const PARKING_ORDERS_PATH = '/estacionamiento/pedidos'

export function OrdersSection() {
  const scope = useEventScope()
  return <OrdersView key={scope.eventId} eventId={scope.eventId} filterSlot={<EventFilter {...scope} />} />
}

export function PaymentsListSection() {
  const scope = useEventScope()
  return (
    <PaymentsView
      key={scope.eventId}
      eventId={scope.eventId}
      ordersPath={PARKING_ORDERS_PATH}
      filterSlot={<EventFilter {...scope} />}
    />
  )
}

/** El escáner del estacionamiento acepta el QR de cualquiera de sus eventos. */
export function ScannerSection() {
  const { account } = useParkingOwnerAccount()
  return <ScannerView eventId={account.base_event_id} />
}

/** Reservas de parking de todos los eventos del estacionamiento (patente, DNI, si ya ingresó). */
export function ParkingReservationsSection() {
  const { account } = useParkingOwnerAccount()
  return (
    <RequireModule module="parking">
      <OrganizerToolHeading
        title="Reservas de vehículos"
        description="Los lugares de parking pagados en todos tus eventos, para controlar la entrada."
      />
      <ParkingReservations eventId={account.base_event_id} />
    </RequireModule>
  )
}

/** Cortesías del estacionamiento: se elige el evento; la lista muestra las de todos los eventos. */
export function CourtesiesSection() {
  const scope = useEventScope()
  return (
    <CourtesyView
      eventId={scope.baseEventId}
      modules={getAuthUser()?.modules ?? []}
      events={scope.options.map(o => ({ id: o.id, name: o.name }))}
    />
  )
}
