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
