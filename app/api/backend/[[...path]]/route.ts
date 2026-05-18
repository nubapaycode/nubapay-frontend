import type { NextRequest } from 'next/server'

export const dynamic = 'force-dynamic'

// ── Mock mode ──────────────────────────────────────────────────────────────
// Activar con NEXT_PUBLIC_MOCK_API=true en .env.local (no necesita backend Flask)
const MOCK_ENABLED =
  process.env.NEXT_PUBLIC_MOCK_API === 'true' ||
  process.env.MOCK_API === 'true'

async function handleMock(req: NextRequest, segments: string[]): Promise<Response> {
  const { resolveMock } = await import('@/mocks/handlers')

  let body: unknown
  const ct = req.headers.get('content-type') ?? ''
  if (ct.includes('application/json') && req.method !== 'GET' && req.method !== 'HEAD') {
    try { body = await req.json() } catch { body = undefined }
  }

  // Añadir latencia artificial para simular red real
  await new Promise((r) => setTimeout(r, 120))

  const result = resolveMock(segments, req.method, body)
  if (!result) {
    return new Response(JSON.stringify({ error: 'Mock: ruta no encontrada' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  return new Response(JSON.stringify(result.json), {
    status: result.status,
    headers: { 'Content-Type': 'application/json' },
  })
}

// ── Real proxy ──────────────────────────────────────────────────────────────
function backendOrigin(): string {
  const raw =
    process.env.NUBAPAY_API_INTERNAL_ORIGIN?.trim() ?? process.env.NEXT_PUBLIC_API_URL?.trim() ?? 'http://127.0.0.1:5001'
  return raw.replace(/\/$/, '')
}

function forwardedBrandHost(req: NextRequest): string {
  return (
    req.headers.get('x-branded-host')?.trim()
    ?? req.headers.get('x-forwarded-host')?.trim()
    ?? req.headers.get('host')?.trim()
    ?? ''
  )
}

const HOP_BYHOP_HEADERS = new Set([
  'connection',
  'content-length',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailers',
  'transfer-encoding',
  'upgrade',
])

/** Encabezados hacia Flask; no pisar un `X-Branded-Host` que ya viene del SSR (`brandedRequestHeaders`). */
function buildOutboundHeaders(req: NextRequest): Headers {
  const out = new Headers()
  req.headers.forEach((value, key) => {
    const low = key.toLowerCase()
    if (low === 'host') return
    // No confiar en `X-Branded-Host` entrante (spoof desde cliente); siempre lo resolvemos desde el host del request.
    if (low === 'x-branded-host') return
    if (HOP_BYHOP_HEADERS.has(low)) return
    out.set(key, value)
  })
  const h = forwardedBrandHost(req)
  if (h) out.set('X-Branded-Host', h)
  return out
}

async function proxyRequest(req: NextRequest, segments: string[]) {
  const tail = segments.join('/')
  const qs = req.nextUrl.search
  const upstreamUrl =
    tail === '' ? `${backendOrigin()}/api${qs}` : `${backendOrigin()}/api/${tail}${qs}`

  const hasBody = !(req.method === 'GET' || req.method === 'HEAD')
  type InitWithDuplex = RequestInit & { duplex?: 'half' }
  const init: InitWithDuplex = {
    method: req.method,
    headers: buildOutboundHeaders(req),
    cache: 'no-store',
    ...(hasBody ? { body: req.body, duplex: 'half' } : {}),
  }

  const upstream = await fetch(upstreamUrl, init)
  return new Response(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: upstream.headers,
  })
}

// ── Route handlers ──────────────────────────────────────────────────────────
type RouteCtx = { params: Promise<{ path?: string[] }> }

async function handle(req: NextRequest, ctx: RouteCtx): Promise<Response> {
  const { path } = await ctx.params
  const segments = path ?? []
  if (MOCK_ENABLED) return handleMock(req, segments)
  return proxyRequest(req, segments)
}

export const GET    = (req: NextRequest, ctx: RouteCtx) => handle(req, ctx)
export const POST   = (req: NextRequest, ctx: RouteCtx) => handle(req, ctx)
export const PUT    = (req: NextRequest, ctx: RouteCtx) => handle(req, ctx)
export const PATCH  = (req: NextRequest, ctx: RouteCtx) => handle(req, ctx)
export const DELETE = (req: NextRequest, ctx: RouteCtx) => handle(req, ctx)
export const OPTIONS = (req: NextRequest, ctx: RouteCtx) => handle(req, ctx)
