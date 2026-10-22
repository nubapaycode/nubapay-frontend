import { permanentRedirect } from 'next/navigation'

/** La vista previa del rediseño ya reemplazó a `/`: los links viejos van a la home. */
export default function NuevoLandingPage() {
  permanentRedirect('/')
}
