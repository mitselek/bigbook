import { describe, expect, it } from 'vitest'
import { diffCurrentVsBaseline } from '../../../src/lib/content/diff'
import type { ParsedChapter } from '../../../src/lib/content/parse'

function chapter(paragraphs: Record<string, string>): ParsedChapter {
  return {
    frontmatter: { chapter: 'ch05', title: 'Kuidas see toimib', lang: 'et' },
    paragraphs: new Map(Object.entries(paragraphs)),
  }
}

describe('diffCurrentVsBaseline()', () => {
  it('returns an empty Set when current and baseline are identical', () => {
    const current = chapter({
      'ch05-title': 'Kuidas see toimib',
      'ch05-p001': 'Oleme harva näinud inimest.',
    })
    const baseline = chapter({
      'ch05-title': 'Kuidas see toimib',
      'ch05-p001': 'Oleme harva näinud inimest.',
    })
    expect(diffCurrentVsBaseline(current, baseline)).toEqual(new Set())
  })
})
