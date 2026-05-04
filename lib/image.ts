// utils/image.ts — compresión previa a subida (mismo enfoque que nuddo)
type CompressOptions = {
  maxSide?: number // default 2048
  quality?: number // default 0.86
}

const ALLOWED_UPLOAD = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/heic',
  'image/heif',
])

function guessMimeFromName(name: string): string {
  const ext = name.split('.').pop()?.toLowerCase() || ''
  if (ext === 'jpg' || ext === 'jpeg') return 'image/jpeg'
  if (ext === 'png') return 'image/png'
  if (ext === 'webp') return 'image/webp'
  if (ext === 'gif') return 'image/gif'
  if (ext === 'heic') return 'image/heic'
  if (ext === 'heif') return 'image/heif'
  return ''
}

export function isAllowedImageUpload(file: File): boolean {
  const mt = (file.type || '').toLowerCase() || guessMimeFromName(file.name)
  return ALLOWED_UPLOAD.has(mt)
}

async function fileToBitmap(file: File): Promise<ImageBitmap> {
  try {
    return await createImageBitmap(file, { imageOrientation: 'from-image' })
  } catch {
    try {
      return await createImageBitmap(file)
    } catch {
      const url = URL.createObjectURL(file)
      try {
        const img = await new Promise<HTMLImageElement>((resolve, reject) => {
          const el = new Image()
          el.onload = () => resolve(el)
          el.onerror = reject
          el.src = url
        })
        const canvas = document.createElement('canvas')
        canvas.width = img.naturalWidth || img.width
        canvas.height = img.naturalHeight || img.height
        const ctx = canvas.getContext('2d')
        if (!ctx) throw new Error('Canvas no disponible')
        ctx.drawImage(img, 0, 0)
        const dataUrl = canvas.toDataURL('image/png')
        const res = await fetch(dataUrl)
        const blob = await res.blob()
        return await createImageBitmap(blob)
      } finally {
        URL.revokeObjectURL(url)
      }
    }
  }
}

async function drawToWebpBlob(bmp: ImageBitmap, opts: Required<CompressOptions>): Promise<Blob> {
  const { maxSide, quality } = opts
  const scale = Math.min(1, maxSide / Math.max(bmp.width, bmp.height))
  const w = Math.max(1, Math.round(bmp.width * scale))
  const h = Math.max(1, Math.round(bmp.height * scale))

  if (typeof OffscreenCanvas !== 'undefined') {
    const off = new OffscreenCanvas(w, h)
    const ctx = off.getContext('2d')
    if (!ctx) throw new Error('Canvas no disponible')
    ctx.drawImage(bmp, 0, 0, w, h)
    const blob = await off.convertToBlob({ type: 'image/webp', quality })
    if (!blob) throw new Error('convertToBlob falló')
    return blob
  }

  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas no disponible')
  ctx.drawImage(bmp, 0, 0, w, h)

  return await new Promise((resolve, reject) =>
    canvas.toBlob(b => (b ? resolve(b) : reject(new Error('toBlob falló'))), 'image/webp', quality),
  )
}

/** Solo normaliza mime para casos simples, no convierte HEIC */
async function ensureDecodable(file: File): Promise<File> {
  const mt0 = (file.type || '').toLowerCase() || guessMimeFromName(file.name)
  const mt = mt0 === 'image/jpg' ? 'image/jpeg' : mt0
  return mt && mt !== mt0 ? new File([file], file.name, { type: mt }) : file
}

/**
 * Comprime a WebP cuando el navegador puede decodificar.
 * HEIC / HEIF: sin conversión en cliente (se sube el original).
 */
export async function compressToWebp(input: File, options: CompressOptions = {}): Promise<File> {
  const opts: Required<CompressOptions> = {
    maxSide: options.maxSide ?? 2048,
    quality: options.quality ?? 0.86,
  }
  if (!isAllowedImageUpload(input)) {
    throw new Error('Tipo de archivo no permitido')
  }

  const mt = (input.type || '').toLowerCase() || guessMimeFromName(input.name)
  if (mt === 'image/heic' || mt === 'image/heif') {
    return input
  }

  const decodable = await ensureDecodable(input)
  const bmp = await fileToBitmap(decodable)
  try {
    const blob = await drawToWebpBlob(bmp, opts)
    return new File([blob], decodable.name.replace(/\.\w+$/, '.webp'), { type: 'image/webp' })
  } finally {
    bmp.close()
  }
}
