import type { NextConfig } from "next";

/** Herramientas del panel: segmento viejo (inglés) → nuevo (español), bajo `/eventos/:eventId/`. */
const LEGACY_EVENT_SEGMENTS: [string, string][] = [
  ["dashboard", "resumen"],
  ["orders", "pedidos"],
  ["products", "productos"],
  ["blocks", "bloques"],
  ["all", "mis-eventos"],
  ["brand", "marca"],
  ["config", "configuracion"],
  ["payments", "pagos"],
  ["pickup-points", "puntos-de-retiro"],
  ["scanner", "escaner"],
  ["scans", "escaneos"],
  ["staff", "equipo"],
  ["storefront", "tienda"],
];

/**
 * Las rutas pasaron al español: las viejas redirigen para no romper marcadores ni links de emails ya enviados
 * (el backend manda `/reset-password` y `/login`). La query string se conserva sola.
 * El orden importa: primero las herramientas, después el resto de `/events`.
 */
const LEGACY_ROUTES: [string, string][] = [
  ...LEGACY_EVENT_SEGMENTS.map(([from, to]): [string, string] => [`/events/:eventId/${from}`, `/eventos/:eventId/${to}`]),
  ...LEGACY_EVENT_SEGMENTS.map(([from, to]): [string, string] => [`/eventos/:eventId/${from}`, `/eventos/:eventId/${to}`]),
  ["/events/:path*", "/eventos/:path*"],
  ["/dashboard", "/panel"],
  ["/login", "/ingresar"],
  ["/register", "/registro"],
  ["/forgot-password", "/recuperar-clave"],
  ["/reset-password", "/restablecer-clave"],
  ["/docs/:path*", "/documentacion/:path*"],
];

/** Proxies Flask: `app/api/backend/[[...path]]/route.ts` reenvía el host público como `X-Branded-Host`. */
const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: "/c/:slug", destination: "/catalogo/:slug", permanent: true },
      ...LEGACY_ROUTES.map(([source, destination]) => ({ source, destination, permanent: true })),
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'randomuser.me',
      },
    ],
  },
};

export default nextConfig;
