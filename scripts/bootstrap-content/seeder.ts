import { readFileSync } from 'node:fs'
import { buildCacheKey, PROMPT_VERSION } from './boderie'
import type { BoderieCache } from './types'

const MODEL = 'claude-sonnet-4-6'

export interface ManualTranslation {
  canonicalSlug: string
  sourceBlockId: string
  kind: string
  sourceLang: 'en' | 'et'
  targetLang: 'en' | 'et'
  sourceText: string
  note?: string
  translation: string | null
}

export interface SeedResult {
  seeded: number
  skipped: number
}

export function seedCacheFromManual(
  cache: BoderieCache,
  manual: readonly ManualTranslation[],
  now: () => string = () => new Date().toISOString(),
): SeedResult {
  let seeded = 0
  let skipped = 0
  for (const entry of manual) {
    if (entry.translation === null) {
      skipped += 1
      continue
    }
    const key = buildCacheKey({
      sourceText: entry.sourceText,
      targetLang: entry.targetLang,
      model: MODEL,
      promptVersion: PROMPT_VERSION,
    })
    if (cache[key] !== undefined) {
      skipped += 1
      continue
    }
    cache[key] = {
      sourceText: entry.sourceText,
      sourceLang: entry.sourceLang,
      targetLang: entry.targetLang,
      model: MODEL,
      promptVersion: PROMPT_VERSION,
      translation: entry.translation,
      calledAt: now(),
      usage: { inputTokens: 0, outputTokens: 0 },
    }
    seeded += 1
  }
  return { seeded, skipped }
}

export function readManualTranslations(path: string): ManualTranslation[] {
  return JSON.parse(readFileSync(path, 'utf8')) as ManualTranslation[]
}
