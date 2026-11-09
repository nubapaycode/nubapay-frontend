import Image from 'next/image'

import type { DocImage } from '@/lib/docs/organizerDocs'

/** Ancho de la barra lateral del panel dentro de las capturas completas (1470 px). */
const SIDEBAR_PX = 264

/**
 * Miniatura de una captura. En las capturas de pantalla completa recorta la barra
 * lateral del panel, que se repite en todas, para que se vea la herramienta.
 */
export function DocThumb({ image, sizes }: { image: DocImage; sizes: string }) {
  if (image.phone) {
    return <Image src={image.src} alt="" fill sizes={sizes} className="object-cover object-top" />
  }
  const fullScreen = image.width === 1470
  if (!fullScreen) {
    return <Image src={image.src} alt="" fill sizes={sizes} className="object-cover object-center" />
  }
  const visible = image.width - SIDEBAR_PX
  return (
    <Image
      src={image.src}
      alt=""
      width={image.width}
      height={image.height}
      sizes={sizes}
      className="absolute top-0 h-auto max-w-none"
      style={{ width: `${(image.width / visible) * 100}%`, left: `-${(SIDEBAR_PX / visible) * 100}%` }}
    />
  )
}
