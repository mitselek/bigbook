import { describe, expect, it } from 'vitest'
import { buildBookSection } from '../../../scripts/extract-en-book/pipeline'
import type { OutlineNode } from '../../../scripts/extract-en-book/types'

const PDF = 'legacy/assets/AA-BigBook-4th-Edition.pdf'

describe('buildBookSection — integration on Foreword to Fourth', () => {
  const node: OutlineNode = {
    title: 'Foreword to Fourth',
    kind: 'foreword',
    pdfPageStart: 12,
  }

  it('produces a well-formed BookSection', () => {
    const section = buildBookSection({
      node,
      chapterOrdinal: 0,
      pdfPath: PDF,
      pdfPageEnd: 13,
      bookPageStart: 12,
      bookPageEnd: 13,
    })
    expect(section.id).toBe('foreword-4th-edition')
    expect(section.kind).toBe('foreword')
    expect(section.title).toBe('Foreword to Fourth')
    expect(section.pdfPageStart).toBe(12)
    expect(section.pdfPageEnd).toBe(13)
    expect(section.blocks.length).toBeGreaterThan(2)
    expect(section.blocks[0]).toMatchObject({
      kind: 'heading',
      id: 'foreword-4th-edition-p001',
    })
    expect(section.blocks[1]).toMatchObject({ kind: 'paragraph' })
    expect(section.blocks[1]?.text).toContain('THIS fourth edition')
  })

  it('every block has a unique ID within the section', () => {
    const section = buildBookSection({
      node,
      chapterOrdinal: 0,
      pdfPath: PDF,
      pdfPageEnd: 13,
      bookPageStart: 12,
      bookPageEnd: 13,
    })
    const ids = new Set(section.blocks.map((b) => b.id))
    expect(ids.size).toBe(section.blocks.length)
  })
})
