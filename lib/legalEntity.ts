/**
 * Datos de quien opera la plataforma. Se muestran en el pie de página de todo el sitio (Meta pide que el
 * nombre del titular y su domicilio estén visibles) y deben coincidir con /terminos y /privacidad.
 */
export const LEGAL_ENTITY = {
  brand: 'Nubapay',
  holder: 'Alejo Vaquero',
  cuit: '23-46971353-9',
  address: 'Bv. Los Andes 665, Piso 2, Dpto. S:E, Barrio Ducasse, 5000 Córdoba, Argentina',
  email: 'contacto@nubapay.app',
} as const

/** "Nubapay es operada por Alejo Vaquero · CUIT 23-46971353-9" */
export const LEGAL_OPERATOR_LINE = `${LEGAL_ENTITY.brand} es operada por ${LEGAL_ENTITY.holder} · CUIT ${LEGAL_ENTITY.cuit}`
