import { Accessibility, Bike, Bus, Car, Caravan, Motorbike, Scooter, Truck, Van, type LucideIcon, type LucideProps } from 'lucide-react'

/** Íconos que el organizador puede elegir para un tipo de vehículo. Las claves son las del backend (services/parking.py). */
export const PARKING_ICONS: { key: string; label: string; Icon: LucideIcon }[] = [
  { key: 'car', label: 'Auto', Icon: Car },
  { key: 'motorcycle', label: 'Moto', Icon: Motorbike },
  { key: 'bicycle', label: 'Bicicleta', Icon: Bike },
  { key: 'scooter', label: 'Monopatín', Icon: Scooter },
  { key: 'van', label: 'Camioneta', Icon: Van },
  { key: 'truck', label: 'Camión', Icon: Truck },
  { key: 'bus', label: 'Colectivo', Icon: Bus },
  { key: 'caravan', label: 'Casa rodante', Icon: Caravan },
  { key: 'accessible', label: 'Accesible', Icon: Accessibility },
]

export const DEFAULT_PARKING_ICON = 'car'

const ICON_BY_KEY: Record<string, LucideIcon> = Object.fromEntries(PARKING_ICONS.map(i => [i.key, i.Icon]))

/** Ícono de un tipo de vehículo; si la clave falta o es desconocida, el auto. */
export function ParkingIcon({ iconKey, ...props }: { iconKey: string | null | undefined } & LucideProps) {
  const Icon = (iconKey ? ICON_BY_KEY[iconKey] : undefined) ?? Car
  return <Icon {...props} />
}
