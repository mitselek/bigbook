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
    const lines = group
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0)
    if (lines.length === 0) continue

    const collapsed = lines.join(' ')
    let kind: BlockKind
    let text: string

    if (!headingEmitted && normalizeForMatch(collapsed).startsWith(normalizedTitle)) {
      kind = 'heading'
      text = collapsed
      headingEmitted = true
    } else {
      kind = detectKind(lines, group)
      text = kind === 'verse' ? lines.join('\n') : collapsed
    }

    const id = `${ctx.sectionId}-p${String(ordinal).padStart(3, '0')}`
    blocks.push({ id, kind, text, pdfPage: ctx.pdfPageStart })
    ordinal += 1
  }
  return blocks
}

function detectKind(lines: string[], _rawGroup: string): BlockKind {
  if (
    lines.length >= 2 &&
    lines.every((l) => l.length <= 60) &&
    linesStartWithQuoteOrIndent(lines)
  ) {
    return 'verse'
  }
  const first = lines[0] ?? ''
  if (/^\*\s+/.test(first) || /^\u2020\s+/.test(first)) {
    return 'footnote'
  }
  if (/^(\d+\.|[a-z]\.|\([a-z0-9]+\))\s/i.test(first)) {
    return 'list-item'
  }
  return 'paragraph'
}

function linesStartWithQuoteOrIndent(lines: string[]): boolean {
  const quoted = lines.filter((l) => /^["\u201C]/.test(l)).length
  return quoted >= 1
}

function normalizeForMatch(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}
