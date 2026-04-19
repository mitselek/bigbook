import { describe, expect, it } from 'vitest'
import { pairBlocks } from '../../../scripts/pair-en-et/block-pair'
import type { ExtractionBlock } from '../../../scripts/pair-en-et/types'

function mkBlocks(
  sectionId: string,
  spec: { kind: ExtractionBlock['kind']; text: string }[],
): ExtractionBlock[] {
  const counts: Record<string, number> = {}
  return spec.map((s) => {
    const prefix = {
      paragraph: 'p',
      heading: 'h',
      'list-item': 'l',
      blockquote: 'q',
      verse: 'v',
      table: 't',
      byline: 'b',
      footnote: 'f',
    }[s.kind]
    counts[prefix] = (counts[prefix] ?? 0) + 1
    const n = String(counts[prefix]).padStart(3, '0')
    return { id: `${sectionId}-${prefix}${n}`, kind: s.kind, text: s.text, pdfPage: 1 }
  })
}

describe('pairBlocks', () => {
  it('position-anchors blocks of equal count per kind', () => {
    const en = mkBlocks('ch01', [
      { kind: 'heading', text: 'Bill' },
      { kind: 'paragraph', text: 'Hello there world' },
      { kind: 'paragraph', text: 'Second paragraph here' },
    ])
    const et = mkBlocks('ch01-et', [
      { kind: 'heading', text: 'Bill' },
      { kind: 'paragraph', text: 'Tere siin maailm' },
      { kind: 'paragraph', text: 'Teine lõik siin' },
    ])
    const result = pairBlocks('ch01', en, et)
    expect(result.pairs.length).toBe(3)
    expect(result.unpaired.length).toBe(0)
    const p0 = result.pairs[0]
    expect(p0).toBeDefined()
    if (p0 === undefined) throw new Error('narrowing')
    expect(p0).toMatchObject({
      paraId: 'ch01-h001',
      kind: 'heading',
      enBlockId: 'ch01-h001',
      etBlockId: 'ch01-et-h001',
      confidence: 'high',
    })
    const p1 = result.pairs[1]
    const p2 = result.pairs[2]
    expect(p1).toBeDefined()
    expect(p2).toBeDefined()
    if (p1 === undefined || p2 === undefined) throw new Error('narrowing')
    expect(p1.paraId).toBe('ch01-p001')
    expect(p2.paraId).toBe('ch01-p002')
  })

  it('downgrades confidence to low when length-ratio is outside band', () => {
    const en = mkBlocks('ch02', [{ kind: 'paragraph', text: 'x'.repeat(100) }])
    const et = mkBlocks('ch02-et', [{ kind: 'paragraph', text: 'y'.repeat(30) }])
    const result = pairBlocks('ch02', en, et)
    expect(result.pairs.length).toBe(1)
    const pair = result.pairs[0]
    expect(pair).toBeDefined()
    if (pair === undefined) throw new Error('narrowing')
    expect(pair.confidence).toBe('low')
    expect(pair.notes).toMatch(/length-ratio/)
  })

  it('flags every block of a kind as needs-review when counts mismatch', () => {
    const en = mkBlocks('s06', [
      { kind: 'blockquote', text: 'one' },
      { kind: 'blockquote', text: 'two' },
      { kind: 'blockquote', text: 'three' },
    ])
    const et = mkBlocks('s06-et', [
      { kind: 'blockquote', text: 'uks' },
      { kind: 'blockquote', text: 'kaks' },
    ])
    const result = pairBlocks('s06', en, et)
    expect(result.pairs.length).toBe(0)
    expect(result.unpaired.length).toBe(5)
    expect(result.unpaired.filter((u) => u.side === 'en').length).toBe(3)
    expect(result.unpaired.filter((u) => u.side === 'et').length).toBe(2)
    expect(result.unpaired.every((u) => u.reason === 'needs-review')).toBe(true)
    expect(result.diagnostics).toContain('kind-count mismatch: blockquote en=3 et=2')
  })

  it('handles multiple kinds independently', () => {
    const en = mkBlocks('ch03', [
      { kind: 'heading', text: 'Title' },
      { kind: 'paragraph', text: 'A' },
      { kind: 'paragraph', text: 'B' },
      { kind: 'blockquote', text: 'Q' },
    ])
    const et = mkBlocks('ch03-et', [
      { kind: 'heading', text: 'Pealkiri' },
      { kind: 'paragraph', text: 'A' },
      { kind: 'paragraph', text: 'B' },
    ])
    const result = pairBlocks('ch03', en, et)
    expect(result.pairs.length).toBe(3)
    expect(result.unpaired.length).toBe(1)
    const first = result.unpaired[0]
    expect(first).toBeDefined()
    if (first === undefined) throw new Error('narrowing')
    expect(first.kind).toBe('blockquote')
    expect(first.side).toBe('en')
  })

  it('handles empty sections', () => {
    const result = pairBlocks('empty', [], [])
    expect(result.pairs.length).toBe(0)
    expect(result.unpaired.length).toBe(0)
    expect(result.diagnostics.length).toBe(0)
  })
})
