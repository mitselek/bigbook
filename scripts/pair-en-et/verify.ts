import type { Extraction, PairingArtifact } from './types'

export interface Violation {
  code: string
  message: string
}

export interface VerifyResult {
  ok: boolean
  violations: Violation[]
}

export function verifyArtifact(
  _artifact: PairingArtifact,
  _en: Extraction,
  _et: Extraction,
): VerifyResult {
  return { ok: true, violations: [] }
}
