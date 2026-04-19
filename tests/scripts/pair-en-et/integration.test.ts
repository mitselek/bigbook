// @vitest-environment node
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { buildArtifact } from '../../../scripts/pair-en-et/pair'
import type { Extraction } from '../../../scripts/pair-en-et/types'

const FIXTURES_DIR = resolve(fileURLToPath(new URL('./fixtures', import.meta.url)))

function loadFixture(name: string): Extraction {
  return JSON.parse(readFileSync(resolve(FIXTURES_DIR, name), 'utf8')) as Extraction
}

describe('buildArtifact (integration)', () => {
  it('pairs a tiny fixture end-to-end', () => {
    const en = loadFixture('en-tiny.json')
    const et = loadFixture('et-tiny.json')
    const artifact = buildArtifact(en, et, {
      sourceEnPath: 'fixtures/en-tiny.json',
      sourceEtPath: 'fixtures/et-tiny.json',
      sourceEnSha: 'fixture-en-sha',
      sourceEtSha: 'fixture-et-sha',
      generatedAt: '2026-04-19T00:00:00Z',
    })
    expect(artifact.sections.length).toBe(1)
    const section = artifact.sections[0]
    expect(section).toBeDefined()
    if (section === undefined) throw new Error('narrowing')
    expect(section.pairs.length).toBe(2)
    const p0 = section.pairs[0]
    const p1 = section.pairs[1]
    expect(p0).toBeDefined()
    expect(p1).toBeDefined()
    if (p0 === undefined || p1 === undefined) throw new Error('narrowing')
    expect(p0.paraId).toBe('ch01-h001')
    expect(p1.paraId).toBe('ch01-p001')
    expect(artifact.unpairedSections.length).toBe(0)
  })

  it('emits an artifact that passes verify', async () => {
    const en = loadFixture('en-tiny.json')
    const et = loadFixture('et-tiny.json')
    const artifact = buildArtifact(en, et, {
      sourceEnPath: 'fixtures/en-tiny.json',
      sourceEtPath: 'fixtures/et-tiny.json',
      sourceEnSha: 'x',
      sourceEtSha: 'y',
      generatedAt: '2026-04-19T00:00:00Z',
    })
    const { verifyArtifact } = await import('../../../scripts/pair-en-et/verify')
    const result = verifyArtifact(artifact, en, et)
    expect(result.violations).toEqual([])
    expect(result.ok).toBe(true)
  })
})
