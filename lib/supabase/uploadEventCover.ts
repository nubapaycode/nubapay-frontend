import { eventsPaths } from '@/lib/api'
import { getAuthToken } from '@/lib/authSession'
import { browserFetch } from '@/lib/browserFetch'
import { compressToWebp, isAllowedImageUpload } from '@/lib/image'

const MAX_BYTES = 5 * 1024 * 1024

export async function uploadEventCoverImage(
  eventId: string,
  file: File,
): Promise<{ ok: true; publicUrl: string } | { ok: false; error: string }> {
  if (!isAllowedImageUpload(file)) {
    return { ok: false, error: 'Formato no permitido (JPG, PNG, WebP, GIF, HEIC/HEIF)' }
  }
  if (file.size > MAX_BYTES * 3) {
    return { ok: false, error: 'La imagen es demasiado grande (máx. ~15 MB antes de comprimir)' }
  }

  let processed: File
  try {
    processed = await compressToWebp(file, { maxSide: 2048, quality: 0.86 })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'No se pudo optimizar la imagen'
    return { ok: false, error: msg }
  }

  if (processed.size > MAX_BYTES) {
    return { ok: false, error: 'Tras comprimir sigue superando 5 MB; probá otra imagen.' }
  }

  const token = getAuthToken()
  if (!token) {
    return { ok: false, error: 'Iniciá sesión para subir la portada.' }
  }

  const form = new FormData()
  form.append('file', processed, processed.name || 'cover.webp')

  const res = await browserFetch(eventsPaths.workspace(eventId, 'cover'), {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  })

  const body = (await res.json()) as { publicUrl?: string; error?: string }
  if (!res.ok || !body.publicUrl) {
    return { ok: false, error: body.error ?? 'No se pudo subir la imagen' }
  }

  return { ok: true, publicUrl: body.publicUrl }
}
