import { describe, expect, it } from 'vitest'
import { renderBlock } from '../../../scripts/bootstrap-content/emit-markdown'
import type { RenderedBlock } from '../../../scripts/bootstrap-content/types'

function mk(
  block: Partial<RenderedBlock> & Pick<RenderedBlock, 'paraId' | 'kind' | 'text'>,
): RenderedBlock {
  return { isAutoTranslated: false, ...block }
}

describe('renderBlock', () => {
  it('renders a heading as # followed by text', () => {
    const out = renderBlock(mk({ paraId: 'ch01-h001', kind: 'heading', text: "BILL'S STORY" }))
    expect(out).toBe(`::para[ch01-h001]\n\n# BILL'S STORY\n`)
  })

  it('renders a paragraph as plain prose', () => {
    const out = renderBlock(
      mk({ paraId: 'ch01-p001', kind: 'paragraph', text: 'War fever ran high.' }),
    )
    expect(out).toBe(`::para[ch01-p001]\n\nWar fever ran high.\n`)
  })

  it('escapes leading year-dot pattern in paragraphs to prevent ordered-list coercion', () => {
    const out = renderBlock(
      mk({
        paraId: 'ch01-p002',
        kind: 'paragraph',
        text: '1940. aastal oli see teine asi.',
      }),
    )
    expect(out).toBe(`::para[ch01-p002]\n\n1940\\. aastal oli see teine asi.\n`)
  })

  it('escapes the leading year-dot pattern at each line of a multi-line paragraph', () => {
    const out = renderBlock(
      mk({
        paraId: 'ch01-p003',
        kind: 'paragraph',
        text: 'Eessõna.\n1929. aastal algas krahh.',
      }),
    )
    expect(out).toBe(`::para[ch01-p003]\n\nEessõna.\n1929\\. aastal algas krahh.\n`)
  })

  it('does not escape year-dot pattern that is not at start of line', () => {
    const out = renderBlock(
      mk({
        paraId: 'ch01-p004',
        kind: 'paragraph',
        text: 'Mid-sentence 1940. should not be escaped.',
      }),
    )
    expect(out).toBe(`::para[ch01-p004]\n\nMid-sentence 1940. should not be escaped.\n`)
  })

  it('escapes year-dot in blockquote lines too', () => {
    const out = renderBlock(
      mk({
        paraId: 's02-q010',
        kind: 'blockquote',
        text: '1940. aastal oli see aasta.',
      }),
    )
    expect(out).toBe(`::para[s02-q010]\n\n> 1940\\. aastal oli see aasta.\n`)
  })

  it('renders a list-item with a hyphen bullet', () => {
    const out = renderBlock(
      mk({ paraId: 'a-pamphlets-l001', kind: 'list-item', text: 'A Brief Guide to A.A.' }),
    )
    expect(out).toBe(`::para[a-pamphlets-l001]\n\n- A Brief Guide to A.A.\n`)
  })

  it('renders a blockquote with > prefix', () => {
    const out = renderBlock(mk({ paraId: 's02-q001', kind: 'blockquote', text: 'Hello there.' }))
    expect(out).toBe(`::para[s02-q001]\n\n> Hello there.\n`)
  })

  it('renders a blockquote with > prefix on each line (multi-line)', () => {
    const out = renderBlock(
      mk({ paraId: 's02-q002', kind: 'blockquote', text: 'Line one.\nLine two.' }),
    )
    expect(out).toBe(`::para[s02-q002]\n\n> Line one.\n> Line two.\n`)
  })

  it('renders a verse preserving line breaks via two-space line endings', () => {
    const out = renderBlock(
      mk({
        paraId: 'ch01-v001',
        kind: 'verse',
        text: 'Here lies a Hampshire Grenadier\nWho caught his death',
      }),
    )
    expect(out).toBe(
      `::para[ch01-v001]\n\nHere lies a Hampshire Grenadier  \nWho caught his death\n`,
    )
  })

  it('renders a byline as an italicized trailing line', () => {
    const out = renderBlock(
      mk({ paraId: 'ch01-b001', kind: 'byline', text: 'Bill W., co-founder of A.A.' }),
    )
    expect(out).toBe(`::para[ch01-b001]\n\n*Bill W., co-founder of A.A.*\n`)
  })

  it('renders a footnote as italicized prose', () => {
    const out = renderBlock(mk({ paraId: 'ch11-f001', kind: 'footnote', text: 'Written in 1939.' }))
    expect(out).toBe(`::para[ch11-f001]\n\n*Written in 1939.*\n`)
  })

  it('appends (_BB:Boderie_) attribution for auto-translated blocks', () => {
    const out = renderBlock(
      mk({
        paraId: 'a-pamphlets-l001',
        kind: 'list-item',
        text: 'Lühike AA juhend',
        isAutoTranslated: true,
      }),
    )
    expect(out).toBe(`::para[a-pamphlets-l001]\n\n- Lühike AA juhend\n\n(_BB:Boderie_)\n`)
  })

  it('appends attribution for auto-translated paragraphs too', () => {
    const out = renderBlock(
      mk({
        paraId: 's30-p013',
        kind: 'paragraph',
        text: 'Anonüümsetes Alkohoolikutes...',
        isAutoTranslated: true,
      }),
    )
    expect(out).toBe(`::para[s30-p013]\n\nAnonüümsetes Alkohoolikutes...\n\n(_BB:Boderie_)\n`)
  })
})

import { renderSection } from '../../../scripts/bootstrap-content/emit-markdown'
import type { SectionRenderPlan } from '../../../scripts/bootstrap-content/types'

function plan(
  partial: Partial<SectionRenderPlan> & Pick<SectionRenderPlan, 'canonicalSlug'>,
): SectionRenderPlan {
  return {
    group: 'chapters',
    title: { en: 'Test', et: 'Test' },
    pdfPageStart: 1,
    pdfPageEnd: 1,
    en: [],
    et: [],
    ...partial,
  }
}

describe('renderSection', () => {
  it('emits frontmatter with chapter, title, lang, group, pdf pages', () => {
    const p = plan({
      canonicalSlug: 'ch01',
      title: { en: "Bill's Story", et: 'Billi lugu' },
      pdfPageStart: 22,
      pdfPageEnd: 37,
      en: [{ paraId: 'ch01-h001', kind: 'heading', text: "BILL'S STORY", isAutoTranslated: false }],
      et: [],
    })
    const enOut = renderSection(p, 'en')
    expect(enOut).toMatch(
      /^---\nchapter: ch01\ntitle: "Bill's Story"\nlang: en\ngroup: chapters\npdfPageStart: 22\npdfPageEnd: 37\n---\n/,
    )
  })

  it('emits ET frontmatter with ET title', () => {
    const p = plan({
      canonicalSlug: 'ch01',
      title: { en: "Bill's Story", et: 'Billi lugu' },
      pdfPageStart: 22,
      pdfPageEnd: 37,
      en: [],
      et: [{ paraId: 'ch01-h001', kind: 'heading', text: 'BILLI LUGU', isAutoTranslated: false }],
    })
    const etOut = renderSection(p, 'et')
    expect(etOut).toContain('title: "Billi lugu"')
    expect(etOut).toContain('lang: et')
  })

  it('renders each block in the array in order', () => {
    const p = plan({
      canonicalSlug: 'ch01',
      en: [
        { paraId: 'ch01-h001', kind: 'heading', text: 'Heading', isAutoTranslated: false },
        { paraId: 'ch01-p001', kind: 'paragraph', text: 'First.', isAutoTranslated: false },
        { paraId: 'ch01-p002', kind: 'paragraph', text: 'Second.', isAutoTranslated: false },
      ],
      et: [],
    })
    const out = renderSection(p, 'en')
    const h001Idx = out.indexOf('::para[ch01-h001]')
    const p001Idx = out.indexOf('::para[ch01-p001]')
    const p002Idx = out.indexOf('::para[ch01-p002]')
    expect(h001Idx).toBeGreaterThan(0)
    expect(p001Idx).toBeGreaterThan(h001Idx)
    expect(p002Idx).toBeGreaterThan(p001Idx)
  })

  it('renders auto-translated blocks with Boderie attribution', () => {
    const p = plan({
      canonicalSlug: 'a-pamphlets',
      title: { en: 'A.A. Pamphlets', et: 'AA brošüürid' },
      et: [
        {
          paraId: 'a-pamphlets-l001',
          kind: 'list-item',
          text: 'Lühike AA juhend',
          isAutoTranslated: true,
        },
      ],
    })
    const out = renderSection(p, 'et')
    expect(out).toContain('::para[a-pamphlets-l001]')
    expect(out).toContain('- Lühike AA juhend')
    expect(out).toContain('(_BB:Boderie_)')
  })

  it('escapes quotes in titles', () => {
    const p = plan({
      canonicalSlug: 's13',
      title: { en: 'The "Housewife" Story', et: '"Koduperenaise" lugu' },
      en: [],
      et: [],
    })
    const out = renderSection(p, 'en')
    expect(out).toContain('title: "The \\"Housewife\\" Story"')
  })

  it('emits empty section (no blocks) with frontmatter only', () => {
    const p = plan({ canonicalSlug: 'empty', en: [], et: [] })
    const out = renderSection(p, 'en')
    expect(out).toMatch(/^---\n[\s\S]+?\n---\n$/)
    expect(out).not.toContain('::para')
  })
})
