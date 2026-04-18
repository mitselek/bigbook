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
  const normalizedTitle = normalizeForMatch(ctx.sectionTitle)
  const rawGroups = mergeRomanHeading(text.split(/\n\s*\n/), normalizedTitle)
  const blocks: Block[] = []
  let ordinal = 1
  let headingEmitted = false

  for (const group of rawGroups) {
    const lines = group
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0)
    if (lines.length === 0) continue

    const collapsed = lines.join(' ')
    const firstLine = lines[0] ?? ''

    if (!headingEmitted && lines.length >= 2 && normalizeForMatch(firstLine) === normalizedTitle) {
      // S2: heading + inline subtitle/body — split into heading + paragraph tail.
      const headingId = `${ctx.sectionId}-p${String(ordinal).padStart(3, '0')}`
      blocks.push({ id: headingId, kind: 'heading', text: firstLine, pdfPage: ctx.pdfPageStart })
      ordinal += 1
      const tailText = lines.slice(1).join(' ')
      const tailId = `${ctx.sectionId}-p${String(ordinal).padStart(3, '0')}`
      blocks.push({ id: tailId, kind: 'paragraph', text: tailText, pdfPage: ctx.pdfPageStart })
      ordinal += 1
      headingEmitted = true
      continue
    }

    let kind: BlockKind
    let blockText: string

    if (!headingEmitted && normalizeForMatch(collapsed).startsWith(normalizedTitle)) {
      kind = 'heading'
      blockText = collapsed
      headingEmitted = true
    } else {
      kind = detectKind(lines, group)
      blockText = kind === 'verse' ? lines.join('\n') : collapsed
    }

    const id = `${ctx.sectionId}-p${String(ordinal).padStart(3, '0')}`
    blocks.push({ id, kind, text: blockText, pdfPage: ctx.pdfPageStart })
    ordinal += 1
  }
  return blocks
}

function mergeRomanHeading(groups: string[], normalizedTitle: string): string[] {
  if (groups.length < 2) return groups
  const first = (groups[0] ?? '').trim()
  const second = (groups[1] ?? '').trim()
  if (!/^[IVX]+$/.test(first)) return groups
  const combined = `${first} ${second}`
  if (normalizeForMatch(combined) !== normalizedTitle) return groups
  return [combined, ...groups.slice(2)]
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
  if (/^\*/.test(first) || /^\u2020\s+/.test(first)) {
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
