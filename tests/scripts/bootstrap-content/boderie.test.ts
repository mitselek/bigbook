import { describe, expect, it } from 'vitest'
import {
  buildCacheKey,
  buildSystemPrompt,
  buildUserPrompt,
  PROMPT_VERSION,
} from '../../../scripts/bootstrap-content/boderie'

describe('buildCacheKey', () => {
  it('produces a stable sha256 hex digest', () => {
    const key = buildCacheKey({
      sourceText: 'Hello world',
      targetLang: 'et',
      model: 'claude-sonnet-4-6',
      promptVersion: '1.0',
    })
    expect(key).toMatch(/^[a-f0-9]{64}$/)
  })

  it('same inputs produce same key (determinism)', () => {
    const a = buildCacheKey({ sourceText: 'A', targetLang: 'et', model: 'm', promptVersion: '1.0' })
    const b = buildCacheKey({ sourceText: 'A', targetLang: 'et', model: 'm', promptVersion: '1.0' })
    expect(a).toBe(b)
  })

  it('different source text produces different key', () => {
    const a = buildCacheKey({ sourceText: 'A', targetLang: 'et', model: 'm', promptVersion: '1.0' })
    const b = buildCacheKey({ sourceText: 'B', targetLang: 'et', model: 'm', promptVersion: '1.0' })
    expect(a).not.toBe(b)
  })

  it('different target language produces different key', () => {
    const a = buildCacheKey({ sourceText: 'A', targetLang: 'et', model: 'm', promptVersion: '1.0' })
    const b = buildCacheKey({ sourceText: 'A', targetLang: 'en', model: 'm', promptVersion: '1.0' })
    expect(a).not.toBe(b)
  })

  it('different model produces different key', () => {
    const a = buildCacheKey({ sourceText: 'A', targetLang: 'et', model: 'x', promptVersion: '1.0' })
    const b = buildCacheKey({ sourceText: 'A', targetLang: 'et', model: 'y', promptVersion: '1.0' })
    expect(a).not.toBe(b)
  })

  it('different prompt version produces different key', () => {
    const a = buildCacheKey({ sourceText: 'A', targetLang: 'et', model: 'm', promptVersion: '1.0' })
    const b = buildCacheKey({ sourceText: 'A', targetLang: 'et', model: 'm', promptVersion: '2.0' })
    expect(a).not.toBe(b)
  })
})

describe('PROMPT_VERSION', () => {
  it('is declared as a string literal 1.0 for this release', () => {
    expect(PROMPT_VERSION).toBe('1.0')
  })
})

describe('buildSystemPrompt', () => {
  it('contains the Boderie persona line', () => {
    expect(buildSystemPrompt()).toContain('Boderie')
    expect(buildSystemPrompt()).toContain('Officina Plantiniana')
  })

  it('contains the output-only directive', () => {
    expect(buildSystemPrompt()).toMatch(/Output ONLY the translation/)
  })

  it('is deterministic (same each call)', () => {
    expect(buildSystemPrompt()).toBe(buildSystemPrompt())
  })
})

describe('buildUserPrompt', () => {
  it('includes source language, target language, and text', () => {
    const prompt = buildUserPrompt({ sourceText: 'Hello', sourceLang: 'en', targetLang: 'et' })
    expect(prompt).toContain('Hello')
    expect(prompt).toMatch(/English/i)
    expect(prompt).toMatch(/Estonian/i)
  })
})
