'use client'

import { Fragment, useEffect, useRef } from 'react'
import { ArrowRight, ChevronDown } from 'lucide-react'

import { Reveal, useActiveSection } from './hooks'
import PageHero, { DocTabs, type DocId } from './PageHero'
import SiteShell from './SiteShell'

export type LegalSection = {
  num: string
  title: string
  body: string
  children?: { subtitle: string; body: string }[]
}

/**
 * Texto legal: los bloques se separan con una línea en blanco; un bloque en el que todas las
 * líneas empiezan con "• " se muestra como lista, y el resto respeta los saltos de línea.
 */
function Prose({ text }: { text: string }) {
  return text.split('\n\n').map((block, i) => {
    const lines = block.split('\n')
    if (lines.every(l => l.startsWith('• '))) {
      return <ul key={i}>{lines.map(l => <li key={l}>{l.slice(2)}</li>)}</ul>
    }
    return <p key={i}>{lines.map((l, j) => <Fragment key={j}>{j > 0 && <br />}{l}</Fragment>)}</p>
  })
}

const sectionId = (num: string) => `sec-${num}`

function Index({ sections, active, onPick }: { sections: LegalSection[]; active: string | null; onPick?: () => void }) {
  return (
    <ol className="lv2-lg-index">
      {sections.map(s => (
        <li key={s.num}>
          <a href={`#${sectionId(s.num)}`} onClick={onPick} className={active === sectionId(s.num) ? 'is-here' : ''}>
            <span>{s.num}</span>{s.title}
          </a>
        </li>
      ))}
    </ol>
  )
}

export default function LegalPage({ doc, lines, intro, meta, sections, contact }: {
  doc: DocId
  /** Primera línea del titular y la palabra que lleva el marcador. */
  lines: [string, string]
  intro: string
  meta: { label: string; value: string }[]
  sections: LegalSection[]
  contact: { title: string; text: string; email: string }
}) {
  const active = useActiveSection(sections.map(s => sectionId(s.num)))
  const sideRef = useRef<HTMLDivElement>(null)
  const mobileRef = useRef<HTMLDetailsElement>(null)

  /* El índice largo scrollea solo: la sección activa queda a la vista dentro de la columna */
  useEffect(() => {
    const box = sideRef.current
    const link = box?.querySelector<HTMLElement>('.is-here')
    if (!box || !link) return
    box.scrollTo({ top: link.offsetTop - box.clientHeight / 2 + link.offsetHeight / 2, behavior: 'smooth' })
  }, [active])

  return (
    <SiteShell navCenter={<DocTabs current={doc} inNav />}>
      <main>
        <PageHero
          id="lv2-lg-h1"
          top={<DocTabs current={doc} />}
          lines={[lines[0], <span key="m" className="lv2-mark lv2-mark--now">{lines[1]}</span>]}
          intro={intro}
        >
          <dl className="lv2-pg-meta">
            {meta.map(m => <div key={m.label}><dt>{m.label}</dt><dd>{m.value}</dd></div>)}
          </dl>
        </PageHero>

        <div className="lv2-wrap lv2-lg">
          <Reveal className="lv2-lg-side">
            <p className="lv2-lg-side-title">Índice <small>{sections.length} secciones</small></p>
            <div ref={sideRef} className="lv2-lg-side-scroll" data-lenis-prevent>
              <Index sections={sections} active={active} />
            </div>
          </Reveal>

          <div className="lv2-lg-body">
            <details ref={mobileRef} className="lv2-lg-mobile">
              <summary>Índice · {sections.length} secciones <ChevronDown size={18} aria-hidden="true" /></summary>
              <div data-lenis-prevent>
                <Index sections={sections} active={active} onPick={() => { if (mobileRef.current) mobileRef.current.open = false }} />
              </div>
            </details>

            {sections.map(s => (
              <section key={s.num} id={sectionId(s.num)} className={`lv2-lg-sec${active === sectionId(s.num) ? ' is-here' : ''}`} aria-labelledby={`${sectionId(s.num)}-h`}>
                <span className="lv2-lg-num" aria-hidden="true">{s.num.padStart(2, '0')}</span>
                <div className="lv2-lg-content">
                  <h2 id={`${sectionId(s.num)}-h`}>{s.title}</h2>
                  <div className="lv2-lg-prose"><Prose text={s.body} /></div>
                  {s.children && (
                    <div className="lv2-lg-subs">
                      {s.children.map(c => (
                        <div key={c.subtitle} className="lv2-lg-sub">
                          <h3>{c.subtitle}</h3>
                          <div className="lv2-lg-prose"><Prose text={c.body} /></div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </section>
            ))}

            <div className="lv2-dark lv2-lg-contact">
              <div>
                <h2>{contact.title}</h2>
                <p>{contact.text}</p>
              </div>
              <a href={`mailto:${contact.email}`} className="lv2-btn">
                {contact.email}
                <span className="lv2-btn-arrow"><ArrowRight size={18} strokeWidth={1.6} /></span>
              </a>
            </div>
          </div>
        </div>
      </main>
    </SiteShell>
  )
}
