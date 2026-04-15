import { describe, expect, it } from 'vitest'
import { validatePair } from '../../../src/lib/content/validate'
import type { ParsedChapter } from '../../../src/lib/content/parse'

function chapter(lang: 'en' | 'et', paragraphs: Record<string, string>): ParsedChapter {
  return {
    frontmatter: { chapter: 'ch05', title: 'How It Works', lang },
    paragraphs: new Map(Object.entries(paragraphs)),
  }
}

describe('validatePair()', () => {
  it('returns ok when both chapters share the same para-id set', () => {
    const en = chapter('en', {
      'ch05-title': 'How It Works',
      'ch05-p001': 'Rarely have we seen a person fail.',
    })
    const et = chapter('et', {
      'ch05-title': 'Kuidas see toimib',
      'ch05-p001': 'Oleme harva näinud inimest.',
    })
    expect(validatePair(en, et)).toEqual({ ok: true })
  })
})
