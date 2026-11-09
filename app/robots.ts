import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/seo'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/eventos/',
          '/panel',
          '/api/',
          '/ingresar',
          '/registro',
          '/recuperar-clave',
          '/restablecer-clave',
          '/catalogo/',
          '/tickets/',
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
