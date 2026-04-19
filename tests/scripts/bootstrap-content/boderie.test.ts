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

import type { BoderieCache } from '../../../scripts/bootstrap-content/types'
import { translate } from '../../../scripts/bootstrap-content/boderie'

interface FakeClient {
  messages: {
    create: (args: unknown) => Promise<{
      content: { type: 'text'; text: string }[]
      usage: { input_tokens: number; output_tokens: number }
    }>
  }
}

function makeFakeClient(response: string, tokens = { input: 10, output: 5 }): FakeClient {
  return {
    messages: {
      create: async () => ({
        content: [{ type: 'text', text: response }],
        usage: { input_tokens: tokens.input, output_tokens: tokens.output },
      }),
    },
  }
}

describe('translate', () => {
  it('returns cache hit when key exists, does not call API', async () => {
    const cache: BoderieCache = {}
    const { buildCacheKey: k } = await import('../../../scripts/bootstrap-content/boderie')
    const ck = k({
      sourceText: 'Hello',
      targetLang: 'et',
      model: 'claude-sonnet-4-6',
      promptVersion: '1.0',
    })
    cache[ck] = {
      sourceText: 'Hello',
      sourceLang: 'en',
      targetLang: 'et',
      model: 'claude-sonnet-4-6',
      promptVersion: '1.0',
      translation: 'Tere (cached)',
      calledAt: '2026-04-19T00:00:00Z',
      usage: { inputTokens: 1, outputTokens: 1 },
    }
    let apiCalls = 0
    const fake = makeFakeClient('Tere (API)')
    fake.messages.create = async () => {
      apiCalls += 1
      return {
        content: [{ type: 'text', text: 'Tere (API)' }],
        usage: { input_tokens: 1, output_tokens: 1 },
      }
    }
    const result = await translate(
      { sourceText: 'Hello', sourceLang: 'en', targetLang: 'et' },
      {
        cache,
        client: fake as unknown as Parameters<typeof translate>[1]['client'],
        now: () => '2026-04-19T00:00:01Z',
      },
    )
    expect(result.translation).toBe('Tere (cached)')
    expect(result.cacheHit).toBe(true)
    expect(apiCalls).toBe(0)
  })

  it('calls API and populates cache on miss', async () => {
    const cache: BoderieCache = {}
    let apiCalls = 0
    const fake = makeFakeClient('Tere maailm')
    fake.messages.create = async () => {
      apiCalls += 1
      return {
        content: [{ type: 'text', text: 'Tere maailm' }],
        usage: { input_tokens: 8, output_tokens: 4 },
      }
    }
    const result = await translate(
      { sourceText: 'Hello world', sourceLang: 'en', targetLang: 'et' },
      {
        cache,
        client: fake as unknown as Parameters<typeof translate>[1]['client'],
        now: () => '2026-04-19T00:00:00Z',
      },
    )
    expect(result.translation).toBe('Tere maailm')
    expect(result.cacheHit).toBe(false)
    expect(apiCalls).toBe(1)
    expect(Object.keys(cache)).toHaveLength(1)
    const entry = Object.values(cache)[0]
    expect(entry).toBeDefined()
    if (entry === undefined) throw new Error('narrowing')
    expect(entry.sourceText).toBe('Hello world')
    expect(entry.translation).toBe('Tere maailm')
    expect(entry.usage.inputTokens).toBe(8)
    expect(entry.usage.outputTokens).toBe(4)
  })

  it('trims whitespace from API response', async () => {
    const cache: BoderieCache = {}
    const fake = makeFakeClient('  Tere  \n')
    const result = await translate(
      { sourceText: 'Hello', sourceLang: 'en', targetLang: 'et' },
      {
        cache,
        client: fake as unknown as Parameters<typeof translate>[1]['client'],
        now: () => '2026-04-19T00:00:00Z',
      },
    )
    expect(result.translation).toBe('Tere')
  })

  it('throws when API response is empty', async () => {
    const cache: BoderieCache = {}
    const fake: FakeClient = {
      messages: {
        create: async () => ({ content: [], usage: { input_tokens: 0, output_tokens: 0 } }),
      },
    }
    await expect(
      translate(
        { sourceText: 'Hello', sourceLang: 'en', targetLang: 'et' },
        {
          cache,
          client: fake as unknown as Parameters<typeof translate>[1]['client'],
          now: () => '2026-04-19T00:00:00Z',
        },
      ),
    ).rejects.toThrow(/empty response/i)
  })
})
