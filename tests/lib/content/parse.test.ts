import { describe, expect, it } from 'vitest'
import { parse, ParseError } from '../../../src/lib/content/parse'

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

  it('parses multiple paragraphs preserving order', () => {
    const input = `---
chapter: ch05
title: Kuidas see toimib
lang: et
---

::para[ch05-title]
Kuidas see toimib

::para[ch05-p001]
Oleme harva näinud inimest.

::para[ch05-p002]
Meie lood avaldavad üldjoontes.
`
    const result = parse(input)
    expect([...result.paragraphs.keys()]).toEqual(['ch05-title', 'ch05-p001', 'ch05-p002'])
    expect(result.paragraphs.get('ch05-p001')).toBe('Oleme harva näinud inimest.')
    expect(result.paragraphs.get('ch05-p002')).toBe('Meie lood avaldavad üldjoontes.')
  })

  it('joins multi-line paragraph bodies with a single newline', () => {
    const input = `---
chapter: ch05
title: Kuidas see toimib
lang: et
---

::para[ch05-p001]
Oleme harva näinud inimest, kes oleks läbi kukkunud,
kui ta oleks põhjalikult järginud meie teed.
Need, kes ei parane, on inimesed, kes ei saa või ei taha.
`
    const result = parse(input)
    expect(result.paragraphs.get('ch05-p001')).toBe(
      'Oleme harva näinud inimest, kes oleks läbi kukkunud,\n' +
        'kui ta oleks põhjalikult järginud meie teed.\n' +
        'Need, kes ei parane, on inimesed, kes ei saa või ei taha.',
    )
  })

  it('throws ParseError when frontmatter is missing', () => {
    const input = `::para[ch05-title]
Kuidas see toimib
`
    expect(() => parse(input)).toThrow(ParseError)
    try {
      parse(input)
    } catch (err) {
      expect(err).toBeInstanceOf(ParseError)
      expect((err as ParseError).category).toBe('frontmatter_missing')
    }
  })

  it('throws ParseError when a directive line is malformed', () => {
    const input = `---
chapter: ch05
title: Kuidas see toimib
lang: et
---

::para[ch05-p001
Oleme harva näinud inimest.
`
    expect(() => parse(input)).toThrow(ParseError)
    try {
      parse(input)
    } catch (err) {
      expect((err as ParseError).category).toBe('directive_malformed')
    }
  })

  it('throws ParseError when a directive has an empty id', () => {
    const input = `---
chapter: ch05
title: Kuidas see toimib
lang: et
---

::para[]
text
`
    expect(() => parse(input)).toThrow(ParseError)
    try {
      parse(input)
    } catch (err) {
      expect((err as ParseError).category).toBe('directive_malformed')
    }
  })

  it('throws when frontmatter is missing the chapter field', () => {
    const input = `---
title: Kuidas see toimib
lang: et
---
`
    expect(() => parse(input)).toThrow(ParseError)
    try {
      parse(input)
    } catch (err) {
      expect((err as ParseError).category).toBe('frontmatter_malformed')
    }
  })

  it('throws when lang is not en or et', () => {
    const input = `---
chapter: ch05
title: Kuidas see toimib
lang: de
---
`
    expect(() => parse(input)).toThrow(ParseError)
    try {
      parse(input)
    } catch (err) {
      expect((err as ParseError).category).toBe('frontmatter_malformed')
    }
  })
})
