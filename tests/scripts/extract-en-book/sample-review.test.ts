import { describe, expect, it } from 'vitest'
import { buildSampleReview } from '../../../scripts/extract-en-book/sample-review'
import type { BigBookEnglish, Block, BlockKind } from '../../../scripts/extract-en-book/types'

function makeBlock(id: string, pdfPage: number, kind: BlockKind = 'paragraph'): Block {
  return { id, kind, text: `text of ${id}`, pdfPage }
}

function sampleDoc(): BigBookEnglish {
  return {
    edition: '4th',
    sourcePdf: 'legacy/assets/AA-BigBook-4th-Edition.pdf',
    extractedAt: '2026-04-18T00:00:00Z',
    sections: [
      {
        id: 'sec-small',
        kind: 'preface',
        title: 'Small Section',
        pdfPageStart: 1,
        pdfPageEnd: 2,
        bookPageStart: 1,
        bookPageEnd: 2,
        blocks: [makeBlock('sec-small-p001', 1, 'heading'), makeBlock('sec-small-p002', 1)],
      },
      {
        id: 'sec-big',
        kind: 'chapter',
        title: 'Big Section',
        pdfPageStart: 10,
        pdfPageEnd: 15,
        bookPageStart: 10,
        bookPageEnd: 15,
        blocks: Array.from({ length: 10 }, (_, i) =>
          makeBlock(`sec-big-p${String(i + 1).padStart(3, '0')}`, 10 + Math.floor(i / 2)),
        ),
      },
    ],
  }
}

describe('buildSampleReview', () => {
  it('is deterministic under a fixed seed', () => {
    const doc = sampleDoc()
    expect(buildSampleReview(doc, 42)).toBe(buildSampleReview(doc, 42))
  })

  it('includes every section id as a header', () => {
    const out = buildSampleReview(sampleDoc(), 42)
    expect(out).toContain('## sec-small')
    expect(out).toContain('## sec-big')
  })

  it('samples up to 3 pairs of consecutive blocks per section', () => {
    const out = buildSampleReview(sampleDoc(), 108)
    // sec-small has 2 blocks — one pair possible; both appear.
    expect(out).toContain('sec-small-p001')
    expect(out).toContain('sec-small-p002')
    // sec-big has 10 blocks — exactly 6 appear, arranged as 3 consecutive pairs.
    const bigIdPattern = /sec-big-p\d{3}/g
    const found = out.match(bigIdPattern) ?? []
    // dedupe while preserving document order (in case overlapping pairs share a neighbor)
    const ordered: string[] = []
    for (const id of found) if (!ordered.includes(id)) ordered.push(id)
    expect(ordered).toHaveLength(6)
    // Confirm pair structure: ordinals at positions 2k and 2k+1 differ by 1.
    for (let k = 0; k < 3; k += 1) {
      const first = ordered[2 * k]
      const second = ordered[2 * k + 1]
      if (first === undefined || second === undefined) throw new Error('pair index missing')
      const a = Number(first.slice(-3))
      const b = Number(second.slice(-3))
      expect(b - a).toBe(1)
    }
  })

  it('annotates each sampled block with kind and pdfPage', () => {
    const out = buildSampleReview(sampleDoc(), 42)
    expect(out).toContain('(kind: heading, pdfPage 1)')
    expect(out).toContain('(kind: paragraph, pdfPage 1)')
  })

  it('different seeds produce different block selections', () => {
    const doc = sampleDoc()
    expect(buildSampleReview(doc, 42)).not.toBe(buildSampleReview(doc, 1337))
  })

  it('pairs are consecutive blocks from the section', () => {
    const out = buildSampleReview(sampleDoc(), 108)
    const bigIdPattern = /sec-big-p\d{3}/g
    const found = out.match(bigIdPattern) ?? []
    const ordered: string[] = []
    for (const id of found) if (!ordered.includes(id)) ordered.push(id)
    // Even number of appearances, forming pairs.
    expect(ordered.length % 2).toBe(0)
    for (let k = 0; k < ordered.length / 2; k += 1) {
      const first = ordered[2 * k]
      const second = ordered[2 * k + 1]
      if (first === undefined || second === undefined) throw new Error('pair index missing')
      const a = Number(first.slice(-3))
      const b = Number(second.slice(-3))
      expect(b - a).toBe(1)
    }
  })
})
