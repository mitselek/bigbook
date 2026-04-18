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

describe('segmentBlocks — heading detection', () => {
  it("marks the first block as 'heading' when it matches the section title", () => {
    const input = ['FOREWORD TO FOURTH EDITION', '', 'THIS fourth edition...'].join('\n')
    const blocks = segmentBlocks(input, {
      sectionTitle: 'Foreword to Fourth',
      sectionId: 'foreword-4th-edition',
      pdfPageStart: 12,
    })
    expect(blocks[0]).toMatchObject({
      kind: 'heading',
      text: 'FOREWORD TO FOURTH EDITION',
      id: 'foreword-4th-edition-p001',
    })
    expect(blocks[1]).toMatchObject({ kind: 'paragraph' })
  })

  it('title-match is case and punctuation tolerant', () => {
    const input = ["BILL'S STORY", '', 'War fever ran high...'].join('\n')
    const blocks = segmentBlocks(input, {
      sectionTitle: "Bill's Story",
      sectionId: 'ch01-bills-story',
      pdfPageStart: 22,
    })
    expect(blocks[0]).toMatchObject({ kind: 'heading' })
  })

  it("does not mark mid-text all-caps lines as 'heading'", () => {
    const input = [
      'FOREWORD TO FOURTH EDITION',
      '',
      'A paragraph',
      '',
      'A STANDALONE SHOUT',
      '',
      'Another paragraph',
    ].join('\n')
    const blocks = segmentBlocks(input, {
      sectionTitle: 'Foreword to Fourth',
      sectionId: 'foreword-4th-edition',
      pdfPageStart: 12,
    })
    expect(blocks[0]).toMatchObject({ kind: 'heading' })
    expect(blocks[1]).toMatchObject({ kind: 'paragraph' })
    expect(blocks[2]).toMatchObject({ kind: 'paragraph' })
    expect(blocks[3]).toMatchObject({ kind: 'paragraph' })
  })
})

describe('segmentBlocks — block-kind detection', () => {
  it('marks short indented quoted lines as verse', () => {
    const input = [
      '"Here lies a Hampshire Grenadier,',
      'who caught his death',
      'drinking cold small beer."',
    ].join('\n')
    const blocks = segmentBlocks(input, {
      sectionTitle: "Bill's Story",
      sectionId: 'ch01-bills-story',
      pdfPageStart: 22,
    })
    expect(blocks[0]).toMatchObject({ kind: 'verse' })
    expect(blocks[0]?.text).toContain('\n')
  })

  it('marks numbered list items', () => {
    const input = '1. First step in the program.'
    const blocks = segmentBlocks(input, {
      sectionTitle: 'How It Works',
      sectionId: 'ch05-how-it-works',
      pdfPageStart: 79,
    })
    expect(blocks[0]).toMatchObject({ kind: 'list-item' })
  })

  it('marks footnote (asterisk-prefixed, short)', () => {
    const input = '* This refers to Bill\u2019s first visit with Dr. Bob.'
    const blocks = segmentBlocks(input, {
      sectionTitle: 'A Vision For You',
      sectionId: 'ch11-a-vision-for-you',
      pdfPageStart: 155,
    })
    expect(blocks[0]).toMatchObject({ kind: 'footnote' })
  })
})
