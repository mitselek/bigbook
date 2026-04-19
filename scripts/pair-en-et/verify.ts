import type { Extraction, PairingArtifact } from './types'

export interface Violation {
  code: string
  message: string
}

export interface VerifyResult {
  ok: boolean
  violations: Violation[]
}

function toArray(x: string | string[]): string[] {
  return Array.isArray(x) ? x : [x]
}

function collectExtractionBlocks(
  ext: Extraction,
): Map<string, { kind: string; sectionId: string }> {
  const out = new Map<string, { kind: string; sectionId: string }>()
  for (const s of ext.sections) {
    for (const b of s.blocks) {
      out.set(b.id, { kind: b.kind, sectionId: s.id })
    }
  }
  return out
}

export function verifyArtifact(
  artifact: PairingArtifact,
  en: Extraction,
  et: Extraction,
): VerifyResult {
  const violations: Violation[] = []
  const enBlocks = collectExtractionBlocks(en)
  const etBlocks = collectExtractionBlocks(et)

  const enRefs = new Map<string, number>()
  const etRefs = new Map<string, number>()
  const paraIds = new Set<string>()

  for (const section of artifact.sections) {
    for (const pair of section.pairs) {
      if (paraIds.has(pair.paraId)) {
        violations.push({
          code: 'I2-duplicate-paraid',
          message: `paraId ${pair.paraId} appears more than once`,
        })
      }
      paraIds.add(pair.paraId)

      for (const id of toArray(pair.enBlockId)) {
        enRefs.set(id, (enRefs.get(id) ?? 0) + 1)
      }
      for (const id of toArray(pair.etBlockId)) {
        etRefs.set(id, (etRefs.get(id) ?? 0) + 1)
      }

      for (const id of toArray(pair.enBlockId)) {
        const b = enBlocks.get(id)
        if (b !== undefined && b.kind !== pair.kind) {
          violations.push({
            code: 'I4-kind-mismatch',
            message: `pair ${pair.paraId} declares kind ${pair.kind} but EN block ${id} is ${b.kind}`,
          })
        }
      }
      for (const id of toArray(pair.etBlockId)) {
        const b = etBlocks.get(id)
        if (b !== undefined && b.kind !== pair.kind) {
          violations.push({
            code: 'I4-kind-mismatch',
            message: `pair ${pair.paraId} declares kind ${pair.kind} but ET block ${id} is ${b.kind}`,
          })
        }
      }

      const isNm = Array.isArray(pair.enBlockId) || Array.isArray(pair.etBlockId)
      if (isNm) {
        const acceptablePhrase =
          pair.notes !== undefined &&
          (pair.notes.includes('accepted-collapse') || pair.notes.includes('accepted-split'))
        if (pair.confidence !== 'low' && !acceptablePhrase) {
          violations.push({
            code: 'I5-nm-needs-justification',
            message: `N:M pair ${pair.paraId} has confidence ${pair.confidence} and no accepted-* note`,
          })
        }
      }
    }

    for (const u of section.unpaired) {
      if (u.side === 'en') enRefs.set(u.blockId, (enRefs.get(u.blockId) ?? 0) + 1)
      else etRefs.set(u.blockId, (etRefs.get(u.blockId) ?? 0) + 1)
    }
  }

  for (const u of artifact.unpairedSections) {
    const source = u.side === 'en' ? en : et
    const section = source.sections.find((s) => s.id === u.sectionId)
    if (section === undefined) continue
    const refs = u.side === 'en' ? enRefs : etRefs
    for (const block of section.blocks) {
      refs.set(block.id, (refs.get(block.id) ?? 0) + 1)
    }
  }

  for (const [id, count] of enRefs) {
    if (count > 1) {
      violations.push({
        code: 'I1-en-duplicate',
        message: `EN block ${id} referenced ${count} times`,
      })
    }
  }
  for (const [id, count] of etRefs) {
    if (count > 1) {
      violations.push({
        code: 'I1-et-duplicate',
        message: `ET block ${id} referenced ${count} times`,
      })
    }
  }
  for (const id of enBlocks.keys()) {
    if (!enRefs.has(id)) {
      violations.push({
        code: 'I1-en-missing',
        message: `EN block ${id} not referenced in artifact`,
      })
    }
  }
  for (const id of etBlocks.keys()) {
    if (!etRefs.has(id)) {
      violations.push({
        code: 'I1-et-missing',
        message: `ET block ${id} not referenced in artifact`,
      })
    }
  }

  return { ok: violations.length === 0, violations }
}
