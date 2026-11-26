'use client'

import { AnnouncementsView } from '@/components/organizer/AnnouncementsView'
import { BlocksView } from '@/components/organizer/BlocksView'
import { MercadoPagoSetupView } from '@/components/organizer/MercadoPagoSetupView'
import { MobbexSetupView } from '@/components/organizer/MobbexSetupView'
import { OrdersView } from '@/components/organizer/OrdersView'
import { PaymentMethodsView } from '@/components/organizer/PaymentMethodsView'
import { PaymentsView } from '@/components/organizer/PaymentsView'
import { ProductsView } from '@/components/organizer/ProductsView'
import { ScannerView } from '@/components/organizer/ScannerView'
import { SipagoSetupView } from '@/components/organizer/SipagoSetupView'
import { StaffView } from '@/components/organizer/StaffView'
import { TicketsView } from '@/components/organizer/TicketsView'
import { useParkingOwnerAccount } from '@/components/parkingOwner/ParkingOwnerAccountContext'
import { EventScopePicker, useEventScope } from '@/components/parkingOwner/EventScopePicker'

/**
 * Secciones de configuración del estacionamiento. Son las mismas vistas del panel de un evento, pero sobre
 * el evento base del estacionamiento: lo que se define acá lo heredan todos sus eventos.
 */

/** Pantallas de conexión de pasarelas del estacionamiento. */
export const PARKING_PAYMENTS_PATH = '/estacionamiento/cobros/metodos-pago'

export function VehiclesSection() {
  const { account } = useParkingOwnerAccount()
  return <TicketsView eventId={account.base_event_id} kind="parking" scope="account" />
}

export function StoreProductsSection() {
  const { account } = useParkingOwnerAccount()
  return <ProductsView eventId={account.base_event_id} />
}

export function StoreBlocksSection() {
  const { account } = useParkingOwnerAccount()
  return <BlocksView eventId={account.base_event_id} />
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
 * base a todos sus eventos); el selector permite mirar un solo evento con las mismas pantallas.
 */

export const PARKING_ORDERS_PATH = '/estacionamiento/pedidos'

export function OrdersSection() {
  const scope = useEventScope()
  return (
    <>
      <EventScopePicker {...scope} />
      <OrdersView key={scope.eventId} eventId={scope.eventId} />
    </>
  )
}

export function PaymentsListSection() {
  const scope = useEventScope()
  return (
    <>
      <EventScopePicker {...scope} />
      <PaymentsView key={scope.eventId} eventId={scope.eventId} ordersPath={PARKING_ORDERS_PATH} />
    </>
  )
}

export function AnnouncementsSection() {
  const scope = useEventScope()
  return (
    <>
      <EventScopePicker {...scope} allLabel="Compradores de todos los eventos" />
      <AnnouncementsView key={scope.eventId} eventId={scope.eventId} />
    </>
  )
}

/** El escáner del estacionamiento acepta el QR de cualquiera de sus eventos. */
export function ScannerSection() {
  const { account } = useParkingOwnerAccount()
  return <ScannerView eventId={account.base_event_id} />
}
