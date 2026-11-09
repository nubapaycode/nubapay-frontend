import { DOC_ARTICLES, DOC_GROUPS, getDocArticle, isIllustrated } from '@/lib/docs/organizerDocs'

describe('organizerDocs', () => {
  it('los slugs son únicos y cada artículo pertenece a un grupo existente', () => {
    const slugs = DOC_ARTICLES.map(a => a.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
    const groups = DOC_GROUPS.map(g => g.key)
    for (const a of DOC_ARTICLES) expect(groups).toContain(a.group)
  })

  it('todas las guías relacionadas existen', () => {
    for (const a of DOC_ARTICLES) {
      for (const slug of a.related ?? []) expect(getDocArticle(slug)).toBeDefined()
    }
  })

  it('arrepentimientos y dominio propio están documentados, sin capturas', () => {
    for (const slug of ['arrepentimientos', 'dominio-propio']) {
      const a = getDocArticle(slug)
      expect(a?.steps.length).toBeGreaterThan(0)
      expect(isIllustrated(a!.steps)).toBe(false)
    }
    expect(getDocArticle('arrepentimientos')?.toolPath).toBe('arrepentimientos')
  })

  it('el resto de las guías sigue siendo ilustrada', () => {
    const text = new Set(['arrepentimientos', 'dominio-propio'])
    for (const a of DOC_ARTICLES.filter(x => !text.has(x.slug))) expect(isIllustrated(a.steps)).toBe(true)
  })
})
