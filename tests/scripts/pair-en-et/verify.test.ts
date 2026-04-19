import { describe, expect, it } from 'vitest'
import { verifyArtifact } from '../../../scripts/pair-en-et/verify'
import type { Extraction, PairingArtifact } from '../../../scripts/pair-en-et/types'

function validArtifact(): PairingArtifact {
  return {
    version: '1.0',
    generatedAt: '2026-04-19T00:00:00Z',
    sourceEn: { path: 'en.json', sha256: 'aaa', blockCount: 2 },
    sourceEt: { path: 'et.json', sha256: 'bbb', blockCount: 2 },
    sections: [
      {
        canonicalSlug: 'ch01',
        enSectionId: 'ch01-bills-story',
        etSectionId: 'ch01-billi-lugu',
        pairs: [
          {
            paraId: 'ch01-p001',
            kind: 'paragraph',
            enBlockId: 'ch01-bills-story-p001',
            etBlockId: 'ch01-billi-lugu-p001',
            confidence: 'high',
          },
          {
            paraId: 'ch01-p002',
            kind: 'paragraph',
            enBlockId: 'ch01-bills-story-p002',
            etBlockId: 'ch01-billi-lugu-p002',
            confidence: 'high',
          },
        ],
        unpaired: [],
        diagnostics: [],
      },
    ],
    unpairedSections: [],
  }
}

function validEn(): Extraction {
  return {
    edition: '4th',
    sourcePdf: 'en.pdf',
    extractedAt: '2026-04-19T00:00:00Z',
    sections: [
      {
        id: 'ch01-bills-story',
        kind: 'chapter',
        title: "Bill's Story",
        pdfPageStart: 1,
        pdfPageEnd: 1,
        bookPageStart: 1,
        bookPageEnd: 1,
        blocks: [
          { id: 'ch01-bills-story-p001', kind: 'paragraph', text: 'A', pdfPage: 1 },
          { id: 'ch01-bills-story-p002', kind: 'paragraph', text: 'B', pdfPage: 1 },
        ],
      },
    ],
  }
}

function validEt(): Extraction {
  return {
    edition: '4th',
    sourcePdf: 'et.pdf',
    extractedAt: '2026-04-19T00:00:00Z',
    sections: [
      {
        id: 'ch01-billi-lugu',
        kind: 'chapter',
        title: 'Billi lugu',
        pdfPageStart: 1,
        pdfPageEnd: 1,
        bookPageStart: 1,
        bookPageEnd: 1,
        blocks: [
          { id: 'ch01-billi-lugu-p001', kind: 'paragraph', text: 'a', pdfPage: 1 },
          { id: 'ch01-billi-lugu-p002', kind: 'paragraph', text: 'b', pdfPage: 1 },
        ],
      },
    ],
  }
}

describe('verifyArtifact', () => {
  it('accepts a well-formed artifact', () => {
    const result = verifyArtifact(validArtifact(), validEn(), validEt())
    expect(result.ok).toBe(true)
    expect(result.violations).toEqual([])
  })

  it('I1: rejects duplicate EN block reference across pairs', () => {
    const a = validArtifact()
    const firstSection = a.sections[0]
    expect(firstSection).toBeDefined()
    if (firstSection === undefined) throw new Error('narrowing')
    const secondPair = firstSection.pairs[1]
    expect(secondPair).toBeDefined()
    if (secondPair === undefined) throw new Error('narrowing')
    secondPair.enBlockId = 'ch01-bills-story-p001'
    const result = verifyArtifact(a, validEn(), validEt())
    expect(result.ok).toBe(false)
    expect(result.violations.some((v) => v.code === 'I1-en-duplicate')).toBe(true)
  })

  it('I1: rejects missing EN block (not referenced anywhere)', () => {
    const a = validArtifact()
    const firstSection = a.sections[0]
    expect(firstSection).toBeDefined()
    if (firstSection === undefined) throw new Error('narrowing')
    const firstPair = firstSection.pairs[0]
    expect(firstPair).toBeDefined()
    if (firstPair === undefined) throw new Error('narrowing')
    firstSection.pairs = [firstPair]
    const result = verifyArtifact(a, validEn(), validEt())
    expect(result.ok).toBe(false)
    expect(result.violations.some((v) => v.code === 'I1-en-missing')).toBe(true)
  })

  it('I2: rejects duplicate paraId', () => {
    const a = validArtifact()
    const firstSection = a.sections[0]
    expect(firstSection).toBeDefined()
    if (firstSection === undefined) throw new Error('narrowing')
    const secondPair = firstSection.pairs[1]
    expect(secondPair).toBeDefined()
    if (secondPair === undefined) throw new Error('narrowing')
    secondPair.paraId = 'ch01-p001'
    const result = verifyArtifact(a, validEn(), validEt())
    expect(result.ok).toBe(false)
    expect(result.violations.some((v) => v.code === 'I2-duplicate-paraid')).toBe(true)
  })

  it('I4: rejects cross-kind pair', () => {
    const a = validArtifact()
    const firstSection = a.sections[0]
    expect(firstSection).toBeDefined()
    if (firstSection === undefined) throw new Error('narrowing')
    const firstPair = firstSection.pairs[0]
    expect(firstPair).toBeDefined()
    if (firstPair === undefined) throw new Error('narrowing')
    firstPair.kind = 'heading'
    const result = verifyArtifact(a, validEn(), validEt())
    expect(result.ok).toBe(false)
    expect(result.violations.some((v) => v.code === 'I4-kind-mismatch')).toBe(true)
  })

  it('I5: rejects N:M pair without low confidence and without accepted-collapse note', () => {
    const a = validArtifact()
    const firstSection = a.sections[0]
    expect(firstSection).toBeDefined()
    if (firstSection === undefined) throw new Error('narrowing')
    const firstPair = firstSection.pairs[0]
    expect(firstPair).toBeDefined()
    if (firstPair === undefined) throw new Error('narrowing')
    firstPair.enBlockId = ['ch01-bills-story-p001', 'ch01-bills-story-p002']
    firstPair.etBlockId = 'ch01-billi-lugu-p001'
    firstSection.pairs = [firstPair]
    const result = verifyArtifact(a, validEn(), validEt())
    expect(result.ok).toBe(false)
    expect(result.violations.some((v) => v.code === 'I5-nm-needs-justification')).toBe(true)
  })

  it('accounts for unpairedSection blocks (no I1-en-missing for whole-section EN-only)', () => {
    const a = validArtifact()
    // Add an EN-only unpaired section so its blocks don't count as missing
    a.sections = []
    a.unpairedSections = [
      {
        side: 'en',
        sectionId: 'ch01-bills-story',
        canonicalSlug: 'ch01',
        reason: 'section-en-only',
        blockCount: 2,
      },
    ]
    const result = verifyArtifact(a, validEn(), validEt())
    // EN blocks from ch01-bills-story are accounted for by the unpaired section.
    // ET blocks still missing (nothing references them), producing I1-et-missing.
    expect(result.violations.some((v) => v.code === 'I1-en-missing')).toBe(false)
    expect(result.violations.some((v) => v.code === 'I1-et-missing')).toBe(true)
  })

  it('I1: rejects duplicate ET block reference across pairs', () => {
    const a = validArtifact()
    const firstSection = a.sections[0]
    expect(firstSection).toBeDefined()
    if (firstSection === undefined) throw new Error('narrowing')
    const secondPair = firstSection.pairs[1]
    expect(secondPair).toBeDefined()
    if (secondPair === undefined) throw new Error('narrowing')
    secondPair.etBlockId = 'ch01-billi-lugu-p001'
    const result = verifyArtifact(a, validEn(), validEt())
    expect(result.ok).toBe(false)
    expect(result.violations.some((v) => v.code === 'I1-et-duplicate')).toBe(true)
  })
})
