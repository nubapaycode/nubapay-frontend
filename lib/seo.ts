import type { Metadata } from 'next'

export const SITE_NAME = 'Nubapay'

export const SITE_DESCRIPTION =
  'Pedí, pagá y retirá sin filas. Menú digital, cobros online y retiro con código QR para eventos y festivales.'

/**
 * Solo definir metadataBase cuando hay URL conocida.
 * Si cae en `http://localhost:3000` en un deploy sin env, los `/favicon.svg` absolutos apuntan mal y el icono no carga.
 */
export function resolveMetadataBase(): URL | undefined {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim()
  if (explicit) {
    try {
      const normalized = explicit.replace(/\/$/, '')
      const withProto = normalized.startsWith('http') ? normalized : `https://${normalized}`
      return new URL(withProto)
    } catch {
      /* ignore invalid URL */
    }
  }
  const vercel = process.env.VERCEL_URL?.trim()
  if (vercel) {
    return new URL(`https://${vercel}`)
  }
  return undefined
}

/** Paneles de organizador: no indexar. */
export const ORGANIZER_ROBOTS: Metadata['robots'] = {
  index: false,
  follow: false,
  googleBot: { index: false, follow: false },
}

/** Carrito, checkout, pedido y QR personal. */
export const BUYER_PRIVATE_ROBOTS: Metadata['robots'] = {
  index: false,
  follow: false,
}

export function pageMeta(opts: {
  title: string
  description: string
  robots?: Metadata['robots']
}): Metadata {
  const { title, description, robots } = opts
  const base: Metadata = {
    title,
    description,
    openGraph: {
      title,
      description,
      siteName: SITE_NAME,
      locale: 'es_AR',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  }
  if (robots) return { ...base, robots }
  return base
}

export function organizerEventSectionMeta(segment: string, description: string): Metadata {
  return pageMeta({ title: segment, description })
}
