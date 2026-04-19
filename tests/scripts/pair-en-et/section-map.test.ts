import { describe, expect, it } from 'vitest'
import enExtraction from '../../../data/extractions/structured/en-4th-edition.json'
import etExtraction from '../../../data/extractions/structured-et/et-4th-edition.json'
import {
  SECTION_MAP,
  entryForSlug,
  slugForEnSection,
  slugForEtSection,
} from '../../../scripts/pair-en-et/section-map'

describe('SECTION_MAP', () => {
  it('has exactly 68 entries', () => {
    expect(SECTION_MAP.length).toBe(68)
  })

  it('has 68 unique canonical slugs', () => {
    const slugs = SECTION_MAP.map((e) => e.canonicalSlug)
    expect(new Set(slugs).size).toBe(68)
  })

  it('maps every EN section in the extraction to a slug exactly once', () => {
    const enIdsInMap = SECTION_MAP.map((e) => e.enSectionId).filter(
      (id): id is string => id !== null,
    )
    const enIdsInExtraction = enExtraction.sections.map((s) => s.id)
    expect(new Set(enIdsInMap)).toEqual(new Set(enIdsInExtraction))
    expect(enIdsInMap.length).toBe(enIdsInExtraction.length)
  })

  it('maps every ET section in the extraction to a slug exactly once', () => {
    const etIdsInMap = SECTION_MAP.map((e) => e.etSectionId).filter(
      (id): id is string => id !== null,
    )
    const etIdsInExtraction = etExtraction.sections.map((s) => s.id)
    expect(new Set(etIdsInMap)).toEqual(new Set(etIdsInExtraction))
    expect(etIdsInMap.length).toBe(etIdsInExtraction.length)
  })

  it('marks appendix-aa-pamphlets as EN-only', () => {
    const entry = SECTION_MAP.find((e) => e.canonicalSlug === 'a-pamphlets')
    expect(entry).toBeDefined()
    expect(entry?.enSectionId).toBe('appendix-aa-pamphlets')
    expect(entry?.etSectionId).toBeNull()
  })
})

describe('slugForEnSection', () => {
  it('returns the canonical slug for a known EN section', () => {
    expect(slugForEnSection('ch01-bills-story')).toBe('ch01')
    expect(slugForEnSection('story-dr-bobs-nightmare')).toBe('s01')
    expect(slugForEnSection('appendix-aa-pamphlets')).toBe('a-pamphlets')
  })

  it('returns null for an unknown EN section', () => {
    expect(slugForEnSection('not-a-real-section')).toBeNull()
  })
})

describe('slugForEtSection', () => {
  it('returns the canonical slug for a known ET section', () => {
    expect(slugForEtSection('ch01-billi-lugu')).toBe('ch01')
    expect(slugForEtSection('story-doktor-bobi-painajalik-unenagu')).toBe('s01')
  })

  it('returns null for an unknown ET section', () => {
    expect(slugForEtSection('not-a-real-section')).toBeNull()
  })
})

describe('entryForSlug', () => {
  it('returns the full entry for a known slug', () => {
    const entry = entryForSlug('ch01')
    expect(entry).toEqual({
      canonicalSlug: 'ch01',
      enSectionId: 'ch01-bills-story',
      etSectionId: 'ch01-billi-lugu',
    })
  })

  it('returns null for an unknown slug', () => {
    expect(entryForSlug('nope')).toBeNull()
  })
})
