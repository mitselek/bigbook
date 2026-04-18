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
  const normalizedTitle = normalizeForMatch(ctx.sectionTitle)
  let ordinal = 1
  let headingEmitted = false

  for (const group of rawGroups) {
    const cleaned = collapseLines(group).trim()
    if (cleaned.length === 0) continue

    let kind: BlockKind = 'paragraph'
    if (!headingEmitted && normalizeForMatch(cleaned).startsWith(normalizedTitle)) {
      kind = 'heading'
      headingEmitted = true
    }

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

function normalizeForMatch(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}
