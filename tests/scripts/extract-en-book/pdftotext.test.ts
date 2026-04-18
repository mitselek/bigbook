import { describe, expect, it } from 'vitest'
import { extractPages } from '../../../scripts/extract-en-book/pdftotext'

const PDF = 'legacy/assets/AA-BigBook-4th-Edition.pdf'

describe('extractPages', () => {
  it('returns text for a page range', () => {
    const text = extractPages(PDF, 12, 13)
    expect(text).toContain('FOREWORD TO FOURTH EDITION')
    expect(text).toContain('November 2001')
  })

  it('preserves blank-line paragraph separators', () => {
    const text = extractPages(PDF, 12, 13)
    expect(text).toMatch(/FOREWORD TO FOURTH EDITION\n\n.*THIS fourth edition/s)
  })

  it('throws on pdftotext non-zero exit', () => {
    expect(() => extractPages('/nonexistent.pdf', 1, 1)).toThrow()
  })
})
