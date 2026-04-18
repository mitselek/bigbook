import { describe, expect, it } from 'vitest'
import { segmentBlocks } from '../../../scripts/extract-en-book/segment'

describe('segmentBlocks — paragraph default', () => {
  it('splits on blank lines', () => {
    const input = ['First paragraph.', '', 'Second paragraph.'].join('\n')
    const blocks = segmentBlocks(input, { sectionTitle: 'Any', sectionId: 'sec', pdfPageStart: 10 })
    expect(blocks).toHaveLength(2)
    expect(blocks[0]).toMatchObject({ kind: 'paragraph', text: 'First paragraph.' })
    expect(blocks[1]).toMatchObject({ kind: 'paragraph', text: 'Second paragraph.' })
  })

  it('joins multi-line paragraphs with spaces', () => {
    const input = ['First line', 'continues here', 'and here.'].join('\n')
    const blocks = segmentBlocks(input, { sectionTitle: 'Any', sectionId: 'sec', pdfPageStart: 10 })
    expect(blocks).toHaveLength(1)
    expect(blocks[0]).toMatchObject({ text: 'First line continues here and here.' })
  })

  it('trims leading and trailing whitespace in each block', () => {
    const input = '   padded   '
    const blocks = segmentBlocks(input, { sectionTitle: 'Any', sectionId: 'sec', pdfPageStart: 10 })
    expect(blocks[0]).toMatchObject({ text: 'padded' })
  })

  it('skips empty input', () => {
    const blocks = segmentBlocks('', { sectionTitle: 'Any', sectionId: 'sec', pdfPageStart: 10 })
    expect(blocks).toEqual([])
  })
})
