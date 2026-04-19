import type { Extraction, PairingArtifact } from './types'

export interface BuildOptions {
  sourceEnPath: string
  sourceEtPath: string
  sourceEnSha: string
  sourceEtSha: string
  generatedAt: string
}

export function buildArtifact(
  _en: Extraction,
  _et: Extraction,
  opts: BuildOptions,
): PairingArtifact {
  return {
    version: '1.0',
    generatedAt: opts.generatedAt,
    sourceEn: { path: opts.sourceEnPath, sha256: opts.sourceEnSha, blockCount: 0 },
    sourceEt: { path: opts.sourceEtPath, sha256: opts.sourceEtSha, blockCount: 0 },
    sections: [],
    unpairedSections: [],
  }
}
