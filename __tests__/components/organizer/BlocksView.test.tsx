import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { BlocksView } from '@/components/organizer/BlocksView'
import { fetchCatalogBlocks, reorderCatalogBlocks } from '@/lib/organizerWorkspace'

jest.mock('@/lib/organizerWorkspace', () => ({
  createCatalogBlock: jest.fn(),
  deleteCatalogBlock: jest.fn(),
  fetchAllCategories: jest.fn().mockResolvedValue({ ok: true, categories: [] }),
  fetchAllWorkspaceProducts: jest.fn().mockResolvedValue({ ok: true, products: [] }),
  fetchCatalogBlocks: jest.fn(),
  patchCatalogBlock: jest.fn(),
  putCatalogBlockProducts: jest.fn(),
  reorderCatalogBlocks: jest.fn(),
}))
jest.mock('@/lib/supabase/uploadCatalogBlockBanner', () => ({
  clearCatalogBlockBanner: jest.fn(),
  uploadCatalogBlockBanner: jest.fn(),
}))

const eventId = 'event-1'
const block = (id: string, title: string, extra = {}) => ({
  id,
  title,
  banner_image_url: null,
  sort_order: 0,
  is_active: true,
  products: [{ product_id: `${id}-p`, name: `Producto de ${title}`, type: 'single', is_active: true }],
  ...extra,
})

const titles = () => screen.getAllByRole('listitem').filter(li => li.getAttribute('draggable') !== null).map(li => li.textContent ?? '')

beforeEach(() => {
  jest.clearAllMocks()
  ;(fetchCatalogBlocks as jest.Mock).mockResolvedValue({
    ok: true,
    blocks: [block('b1', 'Promos de la noche'), block('b2', 'Combos para compartir')],
  })
})

describe('BlocksView', () => {
  it('lista los bloques con su posición', async () => {
    render(<BlocksView eventId={eventId} />)
    expect(await screen.findByText('Promos de la noche')).toBeInTheDocument()
    expect(screen.getByLabelText('Posición 1')).toBeInTheDocument()
    expect(screen.getByLabelText('Posición 2')).toBeInTheDocument()
    expect(screen.getByText(/Aparecen arriba del catálogo en este orden/)).toBeInTheDocument()
  })

  it('"Bajar" cambia el orden y lo guarda', async () => {
    ;(reorderCatalogBlocks as jest.Mock).mockResolvedValue({ ok: true })
    render(<BlocksView eventId={eventId} />)
    await userEvent.click(await screen.findByRole('button', { name: 'Bajar Promos de la noche' }))
    await waitFor(() => expect(reorderCatalogBlocks).toHaveBeenCalledWith(eventId, ['b2', 'b1']))
    expect(titles()[0]).toContain('Combos para compartir')
  })

  it('si no se puede guardar el orden, vuelve al anterior y avisa', async () => {
    ;(reorderCatalogBlocks as jest.Mock).mockResolvedValue({ ok: false, error: 'No se pudo guardar el orden' })
    render(<BlocksView eventId={eventId} />)
    await userEvent.click(await screen.findByRole('button', { name: 'Subir Combos para compartir' }))
    expect(await screen.findByText('No se pudo guardar el orden')).toBeInTheDocument()
    expect(titles()[0]).toContain('Promos de la noche')
  })

  it('muestra el estado vacío', async () => {
    ;(fetchCatalogBlocks as jest.Mock).mockResolvedValue({ ok: true, blocks: [] })
    render(<BlocksView eventId={eventId} />)
    expect(await screen.findByText('Sin bloques destacados')).toBeInTheDocument()
  })
})
