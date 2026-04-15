import { describe, expect, it } from 'vitest'
import { validatePair, validateProposedContent } from '../../../src/lib/content/validate'
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

  it('reports missing_pair when EN has a para-id that ET lacks', () => {
    const en = chapter('en', {
      'ch05-title': 'How It Works',
      'ch05-p001': 'Rarely have we seen a person fail.',
      'ch05-p002': 'Our stories disclose in a general way.',
    })
    const et = chapter('et', {
      'ch05-title': 'Kuidas see toimib',
      'ch05-p001': 'Oleme harva näinud inimest.',
    })
    const result = validatePair(en, et)
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.errors).toHaveLength(1)
    expect(result.errors[0]).toMatchObject({
      category: 'missing_pair',
      paraId: 'ch05-p002',
    })
  })

  it('reports extra_pair when ET has a para-id that EN lacks', () => {
    const en = chapter('en', {
      'ch05-title': 'How It Works',
      'ch05-p001': 'Rarely have we seen a person fail.',
    })
    const et = chapter('et', {
      'ch05-title': 'Kuidas see toimib',
      'ch05-p001': 'Oleme harva näinud inimest.',
      'ch05-p002': 'Meie lood avaldavad üldjoontes.',
    })
    const result = validatePair(en, et)
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.errors).toHaveLength(1)
    expect(result.errors[0]).toMatchObject({
      category: 'extra_pair',
      paraId: 'ch05-p002',
    })
  })

  it('reports both missing_pair and extra_pair when ids diverge on both sides', () => {
    const en = chapter('en', {
      'ch05-title': 'How It Works',
      'ch05-p001': 'Text A.',
    })
    const et = chapter('et', {
      'ch05-title': 'Kuidas see toimib',
      'ch05-p002': 'Text B.',
    })
    const result = validatePair(en, et)
    expect(result.ok).toBe(false)
    if (result.ok) return
    const categories = result.errors.map((e) => e.category).sort()
    expect(categories).toEqual(['extra_pair', 'missing_pair'])
  })
})

describe('validateProposedContent()', () => {
  const validContent = `---
chapter: ch05
title: Kuidas see toimib
lang: et
---

::para[ch05-title]
Kuidas see toimib

::para[ch05-p001]
Oleme harva näinud inimest.
`

  it('returns ok when the content parses and no reference set is given', () => {
    const result = validateProposedContent(validContent)
    expect(result).toEqual({ ok: true })
  })

  it('wraps ParseError into ValidationResult with category parse_error', () => {
    const malformed = `::para[ch05-p001]
no frontmatter
`
    const result = validateProposedContent(malformed)
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.errors).toHaveLength(1)
    expect(result.errors[0]).toMatchObject({ category: 'parse_error' })
  })

  it('reports missing_pair when a reference id is missing from the proposed content', () => {
    const proposed = `---
chapter: ch05
title: Kuidas see toimib
lang: et
---

::para[ch05-title]
Kuidas see toimib
`
    const referenceIds = new Set(['ch05-title', 'ch05-p001'])
    const result = validateProposedContent(proposed, referenceIds)
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.errors).toHaveLength(1)
    expect(result.errors[0]).toMatchObject({
      category: 'missing_pair',
      paraId: 'ch05-p001',
    })
  })

  it('reports extra_pair when the proposed content adds a new para-id', () => {
    const proposed = `---
chapter: ch05
title: Kuidas see toimib
lang: et
---

::para[ch05-title]
Kuidas see toimib

::para[ch05-p001]
Oleme.

::para[ch05-p002]
Meie.
`
    const referenceIds = new Set(['ch05-title', 'ch05-p001'])
    const result = validateProposedContent(proposed, referenceIds)
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.errors).toHaveLength(1)
    expect(result.errors[0]).toMatchObject({
      category: 'extra_pair',
      paraId: 'ch05-p002',
    })
  })

  it('returns ok when the proposed content matches the reference id set exactly', () => {
    const proposed = `---
chapter: ch05
title: Kuidas see toimib
lang: et
---

::para[ch05-title]
Edited title

::para[ch05-p001]
Edited paragraph.
`
    const referenceIds = new Set(['ch05-title', 'ch05-p001'])
    expect(validateProposedContent(proposed, referenceIds)).toEqual({ ok: true })
  })
})
