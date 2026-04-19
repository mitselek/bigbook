import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { buildRenderPlans } from '../../../scripts/bootstrap-content/bootstrap'
import { buildCacheKey } from '../../../scripts/bootstrap-content/boderie'
import {
  seedCacheFromManual,
  type ManualTranslation,
} from '../../../scripts/bootstrap-content/seeder'
import type {
  BoderieCache,
  Extraction,
  PairingArtifact,
} from '../../../scripts/bootstrap-content/types'

const FIXTURES = resolve('tests/scripts/bootstrap-content/fixtures')

function load<T>(name: string): T {
  return JSON.parse(readFileSync(resolve(FIXTURES, name), 'utf8')) as T
}

describe('buildRenderPlans (integration)', () => {
  it('produces a plan with paired blocks + auto-translated orphan filled from manual seed', async () => {
    const artifact = load<PairingArtifact>('tiny-artifact.json')
    const en = load<Extraction>('tiny-en.json')
    const et = load<Extraction>('tiny-et.json')
    const manual = load<ManualTranslation[]>('tiny-manual.json')

    const cache: BoderieCache = {}
    const seedResult = seedCacheFromManual(cache, manual, () => '2026-04-19T00:00:00Z')
    expect(seedResult.seeded).toBe(1)

    const fakeClient = {
      messages: {
        create: async () => {
          throw new Error('manual seed should have covered all translations in this fixture')
        },
      },
    }

    const plans = await buildRenderPlans({
      artifact,
      en,
      et,
      cache,
      client: fakeClient as unknown as Parameters<typeof buildRenderPlans>[0]['client'],
    })

    expect(plans).toHaveLength(1)
    const ch01 = plans[0]
    expect(ch01).toBeDefined()
    if (ch01 === undefined) throw new Error('narrowing')

    expect(ch01.en.map((b) => b.paraId)).toEqual(['ch01-h001', 'ch01-p001', 'ch01-p003'])
    expect(ch01.et.map((b) => b.paraId)).toEqual(['ch01-h001', 'ch01-p001', 'ch01-p003'])

    const etP003 = ch01.et.find((b) => b.paraId === 'ch01-p003')
    expect(etP003).toBeDefined()
    if (etP003 === undefined) throw new Error('narrowing')
    expect(etP003.text).toBe('Orb lõik.')
    expect(etP003.isAutoTranslated).toBe(true)

    const enP003 = ch01.en.find((b) => b.paraId === 'ch01-p003')
    expect(enP003).toBeDefined()
    if (enP003 === undefined) throw new Error('narrowing')
    expect(enP003.text).toBe('Orphan paragraph.')
    expect(enP003.isAutoTranslated).toBe(false)

    // Cache key for manual entry should still be present
    const key = buildCacheKey({
      sourceText: 'Orphan paragraph.',
      targetLang: 'et',
      model: 'claude-sonnet-4-6',
      promptVersion: '1.0',
    })
    expect(cache[key]).toBeDefined()
  })
})
