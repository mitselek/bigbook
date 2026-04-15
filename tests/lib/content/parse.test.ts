import { describe, expect, it } from 'vitest'
import { parse } from '../../../src/lib/content/parse'

describe('parse()', () => {
  it('parses a file with only frontmatter', () => {
    const input = `---
chapter: ch05
title: Kuidas see toimib
lang: et
---
`
    const result = parse(input)
    expect(result.frontmatter).toEqual({
      chapter: 'ch05',
      title: 'Kuidas see toimib',
      lang: 'et',
    })
    expect(result.paragraphs.size).toBe(0)
  })

  it('parses a file with one paragraph directive', () => {
    const input = `---
chapter: ch05
title: Kuidas see toimib
lang: et
---

::para[ch05-title]
Kuidas see toimib
`
    const result = parse(input)
    expect(result.paragraphs.size).toBe(1)
    expect(result.paragraphs.get('ch05-title')).toBe('Kuidas see toimib')
  })
})
