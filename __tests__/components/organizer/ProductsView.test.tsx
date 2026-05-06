import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ProductsView } from '@/components/organizer/ProductsView'
import {
  fetchAllCategories,
  fetchAllWorkspaceProducts,
  fetchWorkspaceProductPromotions,
  fetchWorkspaceProducts,
  patchWorkspaceProduct,
} from '@/lib/organizerWorkspace'

jest.mock('@/lib/organizerWorkspace', () => ({
  createCategory: jest.fn(),
  createWorkspaceProduct: jest.fn(),
  deleteCategory: jest.fn(),
  deleteWorkspaceProduct: jest.fn(),
  deleteWorkspaceProductPromotion: jest.fn(),
  fetchAllCategories: jest.fn(),
  fetchAllWorkspaceProducts: jest.fn(),
  fetchWorkspaceProductPromotions: jest.fn(),
  fetchWorkspaceProducts: jest.fn(),
  patchWorkspaceProduct: jest.fn(),
  upsertWorkspaceProductPromotion: jest.fn(),
}))

const eventId = '00000000-0000-0000-0000-000000000001'

const mockCategories = [{ id: 'c1', name: 'Bebidas', sort_order: 0, is_active: true }]

const mockProducts = [
  {
    id: 'p1',
    event_id: eventId,
    category_id: 'c1',
    category_name: 'Bebidas',
    name: 'Gaseosa 500ml',
    description: '',
    price: 500,
    currency: 'ARS',
    type: 'single' as const,
    is_active: true,
    image_url: null,
    combo_lines: [],
  },
  {
    id: 'p2',
    event_id: eventId,
    category_id: 'c1',
    category_name: 'Bebidas',
    name: 'Agua Mineral 500ml',
    description: '',
    price: 400,
    currency: 'ARS',
    type: 'single' as const,
    is_active: true,
    image_url: null,
    combo_lines: [],
  },
  {
    id: 'combo1',
    event_id: eventId,
    category_id: null,
    category_name: null,
    name: 'Combo Clásico',
    description: '',
    price: 900,
    currency: 'ARS',
    type: 'combo' as const,
    is_active: true,
    image_url: null,
    combo_lines: [{ product_id: 'p1', quantity: 1, name: 'Gaseosa 500ml' }],
  },
  {
    id: 'combo2',
    event_id: eventId,
    category_id: null,
    category_name: null,
    name: 'Combo Familiar',
    description: '',
    price: 1200,
    currency: 'ARS',
    type: 'combo' as const,
    is_active: true,
    image_url: null,
    combo_lines: [
      { product_id: 'p1', quantity: 2, name: 'Gaseosa 500ml' },
      { product_id: 'p2', quantity: 1, name: 'Agua Mineral 500ml' },
    ],
  },
]

function mockFilterProducts(opts?: {
  type?: 'single' | 'combo'
  q?: string
  categoryId?: string
}) {
  let rows = [...mockProducts]
  if (opts?.type) rows = rows.filter(x => x.type === opts.type)
  if (opts?.q?.trim()) {
    const q = opts.q.trim().toLowerCase()
    rows = rows.filter(
      x =>
        x.name.toLowerCase().includes(q)
        || String(x.description ?? '').toLowerCase().includes(q),
    )
  }
  if (opts?.categoryId === 'none') rows = rows.filter(x => x.category_id == null)
  else if (opts?.categoryId) rows = rows.filter(x => x.category_id === opts.categoryId)
  return rows
}

beforeEach(() => {
  ;(fetchAllCategories as jest.Mock).mockResolvedValue({ ok: true, categories: mockCategories })
  ;(fetchWorkspaceProductPromotions as jest.Mock).mockResolvedValue({ ok: true, promotions: [] })
  ;(fetchWorkspaceProducts as jest.Mock).mockImplementation(async (_e: string, opts?: Record<string, unknown>) => {
    const pageSize = (opts?.pageSize as number) ?? 16
    const page = (opts?.page as number) ?? 1
    const filtered = mockFilterProducts({
      type: opts?.type as 'single' | 'combo' | undefined,
      q: opts?.q as string | undefined,
      categoryId: opts?.categoryId as string | undefined,
    })
    const total = filtered.length
    const start = (page - 1) * pageSize
    const slice = filtered.slice(start, start + pageSize)
    return {
      ok: true,
      products: slice,
      pagination: { page, page_size: pageSize, total },
    }
  })
  ;(fetchAllWorkspaceProducts as jest.Mock).mockImplementation(async (_e: string, filters?: { type?: string }) => {
    const filtered = mockFilterProducts({ type: filters?.type as 'single' | 'combo' | undefined })
    return { ok: true, products: filtered }
  })
  ;(patchWorkspaceProduct as jest.Mock).mockImplementation(async (_e: string, productId: string) => {
    const p = mockProducts.find(x => x.id === productId)
    if (!p) return { ok: false, error: 'not found' }
    const next = { ...p, is_active: !p.is_active }
    return { ok: true, product: next }
  })
})

describe('ProductsView', () => {
  it('muestra los nombres de los productos del catálogo', async () => {
    render(<ProductsView eventId={eventId} />)
    await waitFor(() => {
      expect(screen.queryByText('Cargando catálogo…')).not.toBeInTheDocument()
    })
    expect(screen.getByText('Gaseosa 500ml')).toBeInTheDocument()
    expect(screen.getByText('Agua Mineral 500ml')).toBeInTheDocument()
  })

  it('muestra los combos del catálogo', async () => {
    render(<ProductsView eventId={eventId} />)
    await waitFor(() => {
      expect(screen.queryByText('Cargando catálogo…')).not.toBeInTheDocument()
    })
    await userEvent.click(screen.getByRole('tab', { name: 'Combos' }))
    expect(screen.getByText('Combo Clásico')).toBeInTheDocument()
    expect(screen.getByText('Combo Familiar')).toBeInTheDocument()
  })

  it('al desactivar un producto cambia su estado a no disponible', async () => {
    render(<ProductsView eventId={eventId} />)
    await waitFor(() => {
      expect(screen.queryByText('Cargando catálogo…')).not.toBeInTheDocument()
    })
    const checkboxes = screen.getAllByRole('checkbox')
    const firstProductActiveToggle = checkboxes[2]
    expect(firstProductActiveToggle).toBeChecked()
    await userEvent.click(firstProductActiveToggle)
    await waitFor(() => {
      expect(firstProductActiveToggle).not.toBeChecked()
    })
    expect(patchWorkspaceProduct).toHaveBeenCalled()
  })
})
