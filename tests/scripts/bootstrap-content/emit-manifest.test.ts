import { describe, expect, it } from 'vitest'
import { buildManifest } from '../../../scripts/bootstrap-content/emit-manifest'
import type { SectionRenderPlan } from '../../../scripts/bootstrap-content/types'

function plan(slug: string, overrides: Partial<SectionRenderPlan> = {}): SectionRenderPlan {
  return {
    canonicalSlug: slug,
    group: 'chapters',
    title: { en: slug, et: slug },
    pdfPageStart: 1,
    pdfPageEnd: 1,
    en: [],
    et: [],
    ...overrides,
  }
}

describe('buildManifest', () => {
  it('includes all provided sections in order', () => {
    const plans = [plan('ch01'), plan('ch02'), plan('ch03')]
    const m = buildManifest(plans, '2026-04-19T00:00:00Z')
    expect(m.sections).toHaveLength(3)
    expect(m.sections.map((s) => s.canonicalSlug)).toEqual(['ch01', 'ch02', 'ch03'])
  })

  it('records version 1.1 and generatedAt', () => {
    const m = buildManifest([], '2026-04-19T00:00:00Z')
    expect(m.version).toBe('1.1')
    expect(m.generatedAt).toBe('2026-04-19T00:00:00Z')
  })

  it('derives paraIds from en array (canonical side)', () => {
    const plans = [
      plan('ch01', {
        en: [
          { paraId: 'ch01-h001', kind: 'heading', text: 'H', isAutoTranslated: false },
          { paraId: 'ch01-p001', kind: 'paragraph', text: 'P', isAutoTranslated: false },
        ],
        et: [
          { paraId: 'ch01-h001', kind: 'heading', text: 'H', isAutoTranslated: false },
          { paraId: 'ch01-p001', kind: 'paragraph', text: 'P', isAutoTranslated: false },
        ],
      }),
    ]
    const m = buildManifest(plans, '2026-04-19T00:00:00Z')
    const first = m.sections[0]
    expect(first).toBeDefined()
    if (first === undefined) throw new Error('narrowing')
    expect(first.paraIds).toEqual(['ch01-h001', 'ch01-p001'])
  })

  it('passes through group, title, and pdf pages', () => {
    const plans = [
      plan('s01', {
        group: 'stories',
        title: { en: "Bob's Story", et: 'Bobi lugu' },
        pdfPageStart: 186,
        pdfPageEnd: 196,
      }),
    ]
    const m = buildManifest(plans, '2026-04-19T00:00:00Z')
    const first = m.sections[0]
    expect(first).toBeDefined()
    if (first === undefined) throw new Error('narrowing')
    expect(first.group).toBe('stories')
    expect(first.title).toEqual({ en: "Bob's Story", et: 'Bobi lugu' })
    expect(first.pdfPageStart).toBe(186)
    expect(first.pdfPageEnd).toBe(196)
  })
})
