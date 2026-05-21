import type { Metadata } from 'next'

export const SITE_NAME = 'Nubapay'

export const SITE_DESCRIPTION =
  'Pedí, pagá y retirá sin cajas. Menú digital, cobros online y retiro con código QR para eventos y festivales.'

export const SITE_URL = 'https://nubapay.app'

/** Imagen para previews en redes (1200×630). */
export const OG_IMAGE = '/images/og.png'

/**
 * metadataBase con fallback garantizado a SITE_URL.
 * Sin un valor absoluto, las URLs de `og:image` quedan relativas y ni los
 * crawlers ni las redes (WhatsApp/Twitter/LinkedIn) las resuelven.
 */
export function resolveMetadataBase(): URL {
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
  return new URL(SITE_URL)
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
      images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: SITE_NAME }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [OG_IMAGE],
    },
  }
  if (robots) return { ...base, robots }
  return base
}

export function organizerEventSectionMeta(segment: string, description: string): Metadata {
  return pageMeta({ title: segment, description })
}

/** JSON-LD de BreadcrumbList. El primer item siempre es Inicio. */
export function breadcrumbJsonLd(trail: { name: string; path: string }[]): string {
  const items = [{ name: 'Inicio', path: '/' }, ...trail]
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: `${SITE_URL}${item.path === '/' ? '' : item.path}`,
    })),
  })
}
