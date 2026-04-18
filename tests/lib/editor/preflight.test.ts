import { describe, it, expect } from 'vitest'
import { preflight } from '../../../src/lib/editor/preflight'

// Sample chapter ET content with two paragraphs
const currentEt = `---
chapter: ch05-test
title: Test Chapter
lang: et
---

::para[ch05-test-title]
Test Chapter

::para[ch05-test-p001]
Original paragraph text.
`

const referenceParaIds = new Set(['ch05-test-title', 'ch05-test-p001'])

describe('preflight()', () => {
  it('returns ok for a clean, well-formed edit', () => {
    const result = preflight({
      currentEt,
      paraId: 'ch05-test-p001',
      newText: 'Edited text that is completely fine.',
      referenceParaIds,
    })
    expect(result).toEqual({ ok: true })
  })

  it('returns ok when newText contains normal punctuation and whitespace', () => {
    const result = preflight({
      currentEt,
      paraId: 'ch05-test-title',
      newText: 'A new title: with colon, dashes — and "quotes".',
      referenceParaIds,
    })
    expect(result).toEqual({ ok: true })
  })

  it('returns ok when referenceParaIds is omitted (no reference set)', () => {
    const result = preflight({
      currentEt,
      paraId: 'ch05-test-p001',
      newText: 'Some text.',
    })
    expect(result).toEqual({ ok: true })
  })

  it('returns not-ok when newText introduces an extra ::para[] directive line', () => {
    // A user who pastes raw chapter source into the edit field can accidentally
    // inject a ::para[…] line. The serialiser writes it verbatim into the body;
    // the validator's parse() then treats it as a new paragraph, adding an
    // unexpected para-id to the proposed content.
    const newText = '::para[ch05-test-p999]\nThis is injected content.'
    const result = preflight({
      currentEt,
      paraId: 'ch05-test-p001',
      newText,
      referenceParaIds,
    })
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.errors.length).toBeGreaterThan(0)
    // The injected id should appear as an extra para
    const categories = result.errors.map((e) => e.category)
    expect(categories).toContain('extra_pair')
  })

  it('returns not-ok (extra_pair) when newText causes an unexpected para-id to appear', () => {
    // Same scenario, checking the specific error structure
    const newText = 'Intro line.\n\n::para[ch05-test-injected]\nInjected body.'
    const result = preflight({
      currentEt,
      paraId: 'ch05-test-p001',
      newText,
      referenceParaIds,
    })
    expect(result.ok).toBe(false)
    if (result.ok) return
    const extraError = result.errors.find((e) => e.category === 'extra_pair')
    expect(extraError).toBeDefined()
    expect(extraError?.paraId).toBe('ch05-test-injected')
  })
})
