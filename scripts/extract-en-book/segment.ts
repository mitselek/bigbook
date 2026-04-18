/**
 * Turn normalized section text into a typed Block[].
 */

import type { Block, BlockKind } from './types'

export interface SegmentContext {
  sectionTitle: string
  sectionId: string
  pdfPageStart: number
}

export function segmentBlocks(text: string, ctx: SegmentContext): Block[] {
  const rawGroups = text.split(/\n\s*\n/)
  const blocks: Block[] = []
  let ordinal = 1
  for (const group of rawGroups) {
    const cleaned = collapseLines(group).trim()
    if (cleaned.length === 0) continue
    const kind: BlockKind = 'paragraph'
    const id = `${ctx.sectionId}-p${String(ordinal).padStart(3, '0')}`
    blocks.push({ id, kind, text: cleaned, pdfPage: ctx.pdfPageStart })
    ordinal += 1
  }
  return blocks
}

function collapseLines(group: string): string {
  return group
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0)
    .join(' ')
}
