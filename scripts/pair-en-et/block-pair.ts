import { classify } from './confidence'
import type { BlockKind, ExtractionBlock, Pair, UnpairedBlock } from './types'

const ALL_KINDS: readonly BlockKind[] = [
  'heading',
  'paragraph',
  'list-item',
  'blockquote',
  'verse',
  'table',
  'byline',
  'footnote',
]

const KIND_PREFIX: Record<BlockKind, string> = {
  paragraph: 'p',
  heading: 'h',
  'list-item': 'l',
  blockquote: 'q',
  verse: 'v',
  table: 't',
  byline: 'b',
  footnote: 'f',
}

export interface PairBlocksResult {
  pairs: Pair[]
  unpaired: UnpairedBlock[]
  diagnostics: string[]
}

export function pairBlocks(
  canonicalSlug: string,
  enBlocks: readonly ExtractionBlock[],
  etBlocks: readonly ExtractionBlock[],
): PairBlocksResult {
  const pairs: Pair[] = []
  const unpaired: UnpairedBlock[] = []
  const diagnostics: string[] = []

  for (const kind of ALL_KINDS) {
    const enForKind = enBlocks.filter((b) => b.kind === kind)
    const etForKind = etBlocks.filter((b) => b.kind === kind)

    if (enForKind.length === 0 && etForKind.length === 0) continue

    if (enForKind.length !== etForKind.length) {
      diagnostics.push(`kind-count mismatch: ${kind} en=${enForKind.length} et=${etForKind.length}`)
      for (const b of enForKind) {
        unpaired.push({ blockId: b.id, side: 'en', kind, reason: 'needs-review' })
      }
      for (const b of etForKind) {
        unpaired.push({ blockId: b.id, side: 'et', kind, reason: 'needs-review' })
      }
      continue
    }

    const prefix = KIND_PREFIX[kind]
    for (let i = 0; i < enForKind.length; i++) {
      const enBlock = enForKind[i]
      const etBlock = etForKind[i]
      if (enBlock === undefined || etBlock === undefined) continue
      const ordinal = String(i + 1).padStart(3, '0')
      const { confidence, notes } = classify(enBlock.text, etBlock.text)
      const pair: Pair = {
        paraId: `${canonicalSlug}-${prefix}${ordinal}`,
        kind,
        enBlockId: enBlock.id,
        etBlockId: etBlock.id,
        confidence,
      }
      if (notes !== undefined) pair.notes = notes
      pairs.push(pair)
    }
  }

  return { pairs, unpaired, diagnostics }
}
