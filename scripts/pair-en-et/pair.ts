import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { resolve, dirname } from 'node:path'
import { pairBlocks } from './block-pair'
import { renderReviewReport } from './review-report'
import { pairSections } from './section-pair'
import type { Extraction, PairingArtifact } from './types'
import { verifyArtifact } from './verify'

export interface BuildOptions {
  sourceEnPath: string
  sourceEtPath: string
  sourceEnSha: string
  sourceEtSha: string
  generatedAt: string
}

export function buildArtifact(en: Extraction, et: Extraction, opts: BuildOptions): PairingArtifact {
  const { sectionPairs, unpairedSections } = pairSections(en, et)

  const enBlockCount = en.sections.reduce((n, s) => n + s.blocks.length, 0)
  const etBlockCount = et.sections.reduce((n, s) => n + s.blocks.length, 0)

  const artifact: PairingArtifact = {
    version: '1.0',
    generatedAt: opts.generatedAt,
    sourceEn: { path: opts.sourceEnPath, sha256: opts.sourceEnSha, blockCount: enBlockCount },
    sourceEt: { path: opts.sourceEtPath, sha256: opts.sourceEtSha, blockCount: etBlockCount },
    sections: sectionPairs.map((sp) => {
      const { pairs, unpaired, diagnostics } = pairBlocks(
        sp.canonicalSlug,
        sp.enSection.blocks,
        sp.etSection.blocks,
      )
      return {
        canonicalSlug: sp.canonicalSlug,
        enSectionId: sp.enSectionId,
        etSectionId: sp.etSectionId,
        pairs,
        unpaired,
        diagnostics,
      }
    }),
    unpairedSections,
  }

  return artifact
}

function sha256File(path: string): string {
  const buf = readFileSync(path)
  return createHash('sha256').update(buf).digest('hex')
}

function run(argv: string[]): void {
  const mode = argv[0] ?? 'pair'
  const scriptDir = dirname(fileURLToPath(import.meta.url))
  const repoRoot = resolve(scriptDir, '..', '..')
  const enPath = resolve(repoRoot, 'data/extractions/structured/en-4th-edition.json')
  const etPath = resolve(repoRoot, 'data/extractions/structured-et/et-4th-edition.json')
  const artifactPath = resolve(repoRoot, 'data/extractions/pairing/en-et.json')
  const reviewPath = resolve(repoRoot, 'data/extractions/pairing/review.md')

  const en: Extraction = JSON.parse(readFileSync(enPath, 'utf8')) as Extraction
  const et: Extraction = JSON.parse(readFileSync(etPath, 'utf8')) as Extraction

  if (mode === 'verify') {
    const artifact: PairingArtifact = JSON.parse(
      readFileSync(artifactPath, 'utf8'),
    ) as PairingArtifact
    const result = verifyArtifact(artifact, en, et)
    if (!result.ok) {
      console.error('Verification failed:')
      for (const v of result.violations) console.error(`  [${v.code}] ${v.message}`)
      process.exit(1)
    }
    console.log(
      `Verify OK: ${artifact.sections.length} paired sections, ${artifact.unpairedSections.length} unpaired`,
    )
    return
  }

  if (mode === 'review') {
    const artifact: PairingArtifact = JSON.parse(
      readFileSync(artifactPath, 'utf8'),
    ) as PairingArtifact
    const md = renderReviewReport(artifact, en, et)
    writeFileSync(reviewPath, md + '\n')
    console.log(`Wrote ${reviewPath}`)
    return
  }

  const artifact = buildArtifact(en, et, {
    sourceEnPath: 'data/extractions/structured/en-4th-edition.json',
    sourceEtPath: 'data/extractions/structured-et/et-4th-edition.json',
    sourceEnSha: sha256File(enPath),
    sourceEtSha: sha256File(etPath),
    generatedAt: new Date().toISOString(),
  })

  const verify = verifyArtifact(artifact, en, et)
  if (!verify.ok) {
    console.error('Generated artifact failed verification:')
    for (const v of verify.violations) console.error(`  [${v.code}] ${v.message}`)
    process.exit(1)
  }

  writeFileSync(artifactPath, JSON.stringify(artifact, null, 2) + '\n')
  const md = renderReviewReport(artifact, en, et)
  writeFileSync(reviewPath, md + '\n')

  console.log(`Wrote ${artifactPath}`)
  console.log(`Wrote ${reviewPath}`)
  console.log(
    `Summary: ${artifact.sections.length} paired sections, ${artifact.unpairedSections.length} unpaired sections`,
  )
}

const isMainModule =
  typeof process !== 'undefined' &&
  process.argv[1] !== undefined &&
  fileURLToPath(import.meta.url) === resolve(process.argv[1])

if (isMainModule) {
  run(process.argv.slice(2))
}
