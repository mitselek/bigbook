import { describe, expect, it } from 'vitest'
import { pairSections } from '../../../scripts/pair-en-et/section-pair'
import type { Extraction } from '../../../scripts/pair-en-et/types'

function mkExtraction(sectionIds: string[]): Extraction {
  return {
    edition: '4th',
    sourcePdf: 'fixture.pdf',
    extractedAt: '2026-04-19T00:00:00Z',
    sections: sectionIds.map((id) => ({
      id,
      kind: 'chapter',
      title: id,
      pdfPageStart: 1,
      pdfPageEnd: 1,
      bookPageStart: 1,
      bookPageEnd: 1,
      blocks: [],
    })),
  }
}

describe('pairSections', () => {
  it('pairs EN and ET sections that share a canonical slug', () => {
    const en = mkExtraction(['ch01-bills-story'])
    const et = mkExtraction(['ch01-billi-lugu'])
    const result = pairSections(en, et)
    expect(result.sectionPairs.length).toBe(1)
    expect(result.sectionPairs[0]).toMatchObject({
      canonicalSlug: 'ch01',
      enSectionId: 'ch01-bills-story',
      etSectionId: 'ch01-billi-lugu',
    })
    expect(result.unpairedSections.length).toBe(0)
  })

  it('emits UnpairedSection for EN-only sections (a-pamphlets)', () => {
    const en = mkExtraction(['appendix-aa-pamphlets'])
    const et = mkExtraction([])
    const result = pairSections(en, et)
    expect(result.sectionPairs.length).toBe(0)
    expect(result.unpairedSections).toEqual([
      {
        side: 'en',
        sectionId: 'appendix-aa-pamphlets',
        canonicalSlug: 'a-pamphlets',
        reason: 'section-en-only',
        blockCount: 0,
      },
    ])
  })

  it('emits UnpairedSection side=en when ET is missing a paired slug at runtime', () => {
    const en = mkExtraction(['ch01-bills-story'])
    const et = mkExtraction([])
    const result = pairSections(en, et)
    expect(result.sectionPairs.length).toBe(0)
    expect(result.unpairedSections.length).toBe(1)
    const first = result.unpairedSections[0]
    expect(first).toBeDefined()
    if (first === undefined) throw new Error('narrowing')
    expect(first.reason).toBe('section-en-only')
    expect(first.side).toBe('en')
  })

  it('throws when an extraction section has no canonical slug', () => {
    const en = mkExtraction(['unknown-section'])
    const et = mkExtraction([])
    expect(() => pairSections(en, et)).toThrow(/unknown.*canonical slug/i)
  })

  it('carries block counts on UnpairedSection', () => {
    const en: Extraction = {
      edition: '4th',
      sourcePdf: 'fixture.pdf',
      extractedAt: '2026-04-19T00:00:00Z',
      sections: [
        {
          id: 'appendix-aa-pamphlets',
          kind: 'appendix',
          title: 'A.A. Pamphlets',
          pdfPageStart: 581,
          pdfPageEnd: 581,
          bookPageStart: 573,
          bookPageEnd: 573,
          blocks: Array.from({ length: 49 }, (_, i) => ({
            id: `appendix-aa-pamphlets-l${String(i + 1).padStart(3, '0')}`,
            kind: 'list-item' as const,
            text: `item ${i + 1}`,
            pdfPage: 581,
          })),
        },
      ],
    }
    const et = mkExtraction([])
    const result = pairSections(en, et)
    const first = result.unpairedSections[0]
    expect(first).toBeDefined()
    if (first === undefined) throw new Error('narrowing')
    expect(first.blockCount).toBe(49)
  })

  it('throws when an ET extraction section has no canonical slug mapping', () => {
    const en = mkExtraction([])
    const et = mkExtraction(['not-an-et-section'])
    expect(() => pairSections(en, et)).toThrow(/ET section.*no canonical slug mapping/i)
  })

  it('emits UnpairedSection side=et when EN is missing but ET has the paired slug', () => {
    // Use ch01 slug: EN missing, ET present as ch01-billi-lugu
    const en = mkExtraction([])
    const et = mkExtraction(['ch01-billi-lugu'])
    const result = pairSections(en, et)
    expect(result.sectionPairs.length).toBe(0)
    expect(result.unpairedSections.length).toBe(1)
    const first = result.unpairedSections[0]
    expect(first).toBeDefined()
    if (first === undefined) throw new Error('narrowing')
    expect(first.side).toBe('et')
    expect(first.sectionId).toBe('ch01-billi-lugu')
    expect(first.canonicalSlug).toBe('ch01')
  })
})
