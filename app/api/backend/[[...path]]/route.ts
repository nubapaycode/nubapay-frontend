import type { NextRequest } from 'next/server'

export const dynamic = 'force-dynamic'

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
    if (HOP_BYHOP_HEADERS.has(low)) return
    out.set(key, value)
  })
  if (!out.has('X-Branded-Host')) {
    const h = forwardedBrandHost(req)
    if (h) out.set('X-Branded-Host', h)
  }
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

type RouteCtx = { params: Promise<{ path?: string[] }> }

export async function GET(req: NextRequest, ctx: RouteCtx) {
  const { path } = await ctx.params
  return proxyRequest(req, path ?? [])
}

export async function POST(req: NextRequest, ctx: RouteCtx) {
  const { path } = await ctx.params
  return proxyRequest(req, path ?? [])
}

export async function PUT(req: NextRequest, ctx: RouteCtx) {
  const { path } = await ctx.params
  return proxyRequest(req, path ?? [])
}

export async function PATCH(req: NextRequest, ctx: RouteCtx) {
  const { path } = await ctx.params
  return proxyRequest(req, path ?? [])
}

export async function DELETE(req: NextRequest, ctx: RouteCtx) {
  const { path } = await ctx.params
  return proxyRequest(req, path ?? [])
}

export async function OPTIONS(req: NextRequest, ctx: RouteCtx) {
  const { path } = await ctx.params
  return proxyRequest(req, path ?? [])
}
