import { describe, expect, it } from 'vitest'
import { buildCacheKey, PROMPT_VERSION } from '../../../scripts/bootstrap-content/boderie'
import {
  seedCacheFromManual,
  type ManualTranslation,
} from '../../../scripts/bootstrap-content/seeder'
import type { BoderieCache } from '../../../scripts/bootstrap-content/types'

function mkManual(
  partial: Partial<ManualTranslation> &
    Pick<ManualTranslation, 'sourceText' | 'targetLang' | 'translation'>,
): ManualTranslation {
  return {
    canonicalSlug: 'ch01',
    sourceBlockId: 'ch01-p001',
    kind: 'paragraph',
    sourceLang: 'en',
    note: '',
    ...partial,
  }
}

describe('seedCacheFromManual', () => {
  it('seeds an entry when translation is non-null and key missing', () => {
    const cache: BoderieCache = {}
    const result = seedCacheFromManual(
      cache,
      [mkManual({ sourceText: 'Hello', targetLang: 'et', translation: 'Tere' })],
      () => '2026-04-19T00:00:00Z',
    )
    expect(result).toEqual({ seeded: 1, skipped: 0 })
    expect(Object.keys(cache)).toHaveLength(1)
    const key = buildCacheKey({
      sourceText: 'Hello',
      targetLang: 'et',
      model: 'claude-sonnet-4-6',
      promptVersion: PROMPT_VERSION,
    })
    const entry = cache[key]
    expect(entry).toBeDefined()
    if (entry === undefined) throw new Error('narrowing')
    expect(entry.translation).toBe('Tere')
    expect(entry.usage).toEqual({ inputTokens: 0, outputTokens: 0 })
  })

  it('skips entries with null translation', () => {
    const cache: BoderieCache = {}
    const result = seedCacheFromManual(cache, [
      mkManual({ sourceText: 'X', targetLang: 'et', translation: null }),
    ])
    expect(result).toEqual({ seeded: 0, skipped: 1 })
    expect(Object.keys(cache)).toHaveLength(0)
  })

  it('skips entries whose cache key is already populated', () => {
    const cache: BoderieCache = {}
    const key = buildCacheKey({
      sourceText: 'Hello',
      targetLang: 'et',
      model: 'claude-sonnet-4-6',
      promptVersion: PROMPT_VERSION,
    })
    cache[key] = {
      sourceText: 'Hello',
      sourceLang: 'en',
      targetLang: 'et',
      model: 'claude-sonnet-4-6',
      promptVersion: PROMPT_VERSION,
      translation: 'Existing',
      calledAt: '2026-04-19T00:00:00Z',
      usage: { inputTokens: 1, outputTokens: 1 },
    }
    const result = seedCacheFromManual(cache, [
      mkManual({ sourceText: 'Hello', targetLang: 'et', translation: 'NewTranslation' }),
    ])
    expect(result).toEqual({ seeded: 0, skipped: 1 })
    const entry = cache[key]
    expect(entry).toBeDefined()
    if (entry === undefined) throw new Error('narrowing')
    expect(entry.translation).toBe('Existing')
  })

  it('handles mixed batch', () => {
    const cache: BoderieCache = {}
    const result = seedCacheFromManual(cache, [
      mkManual({ sourceText: 'A', targetLang: 'et', translation: 'AA' }),
      mkManual({ sourceText: 'B', targetLang: 'et', translation: null }),
      mkManual({ sourceText: 'C', targetLang: 'et', translation: 'CC' }),
    ])
    expect(result).toEqual({ seeded: 2, skipped: 1 })
    expect(Object.keys(cache)).toHaveLength(2)
  })
})
