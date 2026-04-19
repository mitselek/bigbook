import type { Extraction, ExtractionBlock, PairingArtifact, SectionPair } from './types'

function indexBlocks(extraction: Extraction): Map<string, ExtractionBlock> {
  const m = new Map<string, ExtractionBlock>()
  for (const section of extraction.sections) {
    for (const block of section.blocks) {
      m.set(block.id, block)
    }
  }
  return m
}

function sectionNeedsReview(section: SectionPair): boolean {
  return (
    section.pairs.some((p) => p.confidence === 'low') ||
    section.unpaired.some((u) => u.reason === 'needs-review')
  )
}

function truncate(text: string, maxLen: number): string {
  return text.length > maxLen ? text.slice(0, maxLen) + '…' : text
}

export function renderReviewReport(
  artifact: PairingArtifact,
  en: Extraction,
  et: Extraction,
): string {
  const enBlocks = indexBlocks(en)
  const etBlocks = indexBlocks(et)

  const reviewSections = artifact.sections.filter(sectionNeedsReview)
  const lines: string[] = []

  lines.push(`# Pairing review — generated ${artifact.generatedAt}`)
  lines.push('')
  lines.push(
    `**Summary:** ${reviewSections.length} sections need review · ${artifact.unpairedSections.length} unpaired sections`,
  )
  lines.push('')

  if (artifact.unpairedSections.length > 0) {
    lines.push('## Unpaired sections')
    lines.push('')
    for (const u of artifact.unpairedSections) {
      lines.push(
        `- **${u.canonicalSlug}** (${u.side}-only, ${u.reason}) · ${u.sectionId} · ${u.blockCount} blocks`,
      )
    }
    lines.push('')
  }

  for (const section of reviewSections) {
    const lowPairs = section.pairs.filter((p) => p.confidence === 'low')
    lines.push(`## ${section.canonicalSlug} — ${section.enSectionId} ↔ ${section.etSectionId}`)
    lines.push('')
    lines.push(
      `**Status:** ${lowPairs.length} low-confidence pair${lowPairs.length === 1 ? '' : 's'} · ${section.unpaired.length} unpaired block${section.unpaired.length === 1 ? '' : 's'}`,
    )
    lines.push('')

    if (section.diagnostics.length > 0) {
      lines.push('### Diagnostics')
      lines.push('')
      for (const d of section.diagnostics) lines.push(`- ${d}`)
      lines.push('')
    }

    if (lowPairs.length > 0) {
      lines.push('### Low-confidence pairs')
      lines.push('')
      for (const p of lowPairs) {
        const enId = Array.isArray(p.enBlockId) ? p.enBlockId.join(', ') : p.enBlockId
        const etId = Array.isArray(p.etBlockId) ? p.etBlockId.join(', ') : p.etBlockId
        const enText = Array.isArray(p.enBlockId)
          ? p.enBlockId.map((id) => enBlocks.get(id)?.text ?? '').join(' | ')
          : (enBlocks.get(p.enBlockId)?.text ?? '')
        const etText = Array.isArray(p.etBlockId)
          ? p.etBlockId.map((id) => etBlocks.get(id)?.text ?? '').join(' | ')
          : (etBlocks.get(p.etBlockId)?.text ?? '')
        lines.push(`- **${p.paraId}** (${p.kind})${p.notes ? ` — ${p.notes}` : ''}`)
        lines.push(`  - EN \`${enId}\`: "${truncate(enText, 200)}"`)
        lines.push(`  - ET \`${etId}\`: "${truncate(etText, 200)}"`)
      }
      lines.push('')
    }

    if (section.unpaired.length > 0) {
      lines.push('### Unpaired blocks')
      lines.push('')
      for (const u of section.unpaired) {
        const text =
          u.side === 'en'
            ? (enBlocks.get(u.blockId)?.text ?? '')
            : (etBlocks.get(u.blockId)?.text ?? '')
        lines.push(
          `- **${u.blockId}** (${u.side}, ${u.kind}, ${u.reason}): "${truncate(text, 200)}"`,
        )
      }
      lines.push('')
    }
  }

  return lines.join('\n')
}
