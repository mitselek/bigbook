import { describe, expect, it } from 'vitest'
import { validateExtraction } from '../../../scripts/extract-en-book/invariants'
import type { BigBookEnglish } from '../../../scripts/extract-en-book/types'

function sampleDoc(overrides: Partial<BigBookEnglish> = {}): BigBookEnglish {
  return {
    edition: '4th',
    sourcePdf: 'legacy/assets/AA-BigBook-4th-Edition.pdf',
    extractedAt: '2026-04-18T00:00:00Z',
    sections: [
      {
        id: 'preface',
        kind: 'preface',
        title: 'Preface',
        pdfPageStart: 2,
        pdfPageEnd: 3,
        bookPageStart: 2,
        bookPageEnd: 3,
        blocks: [
          { id: 'preface-p001', kind: 'heading', text: 'Preface', pdfPage: 2 },
          { id: 'preface-p002', kind: 'paragraph', text: 'Hello.', pdfPage: 2 },
        ],
      },
    ],
    ...overrides,
  }
}

describe('validateExtraction', () => {
  it('passes a well-formed document', () => {
    expect(() => validateExtraction(sampleDoc())).not.toThrow()
  })

  it('rejects duplicate section IDs', () => {
    const doc = sampleDoc()
    doc.sections.push({ ...doc.sections[0]! })
    expect(() => validateExtraction(doc)).toThrow(/duplicate section id/i)
  })

  it('rejects duplicate block IDs within a section', () => {
    const doc = sampleDoc()
    doc.sections[0]!.blocks.push({ ...doc.sections[0]!.blocks[0]! })
    expect(() => validateExtraction(doc)).toThrow(/duplicate block id/i)
  })

  it('rejects empty block text', () => {
    const doc = sampleDoc()
    doc.sections[0]!.blocks[0]!.text = '   '
    expect(() => validateExtraction(doc)).toThrow(/empty text/i)
  })

  it('rejects section with zero blocks (unless allowlisted)', () => {
    const doc = sampleDoc()
    doc.sections[0]!.blocks = []
    expect(() => validateExtraction(doc)).toThrow(/zero blocks/i)
  })

  it('allows allowlisted short sections', () => {
    const doc = sampleDoc()
    doc.sections[0] = {
      ...doc.sections[0]!,
      id: 'appendix-aa-pamphlets',
      kind: 'appendix',
      title: 'A.A. Pamphlets',
      pdfPageStart: 581,
      pdfPageEnd: 581,
      bookPageStart: 581,
      bookPageEnd: 581,
      blocks: [{ id: 'appendix-aa-pamphlets-p001', kind: 'paragraph', text: 'list', pdfPage: 581 }],
    }
    expect(() => validateExtraction(doc)).not.toThrow()
  })

  it('rejects pdfPageStart > pdfPageEnd', () => {
    const doc = sampleDoc()
    doc.sections[0]!.pdfPageStart = 10
    doc.sections[0]!.pdfPageEnd = 5
    expect(() => validateExtraction(doc)).toThrow(/page range/i)
  })
})
