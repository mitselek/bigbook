/**
 * Produce a markdown report with up to 3 pairs of consecutive blocks per
 * section for PO proofreading. Pairs expose paragraph-boundary quality
 * directly by placing `blocks[i]` and `blocks[i+1]` back-to-back in output.
 */

import type { BigBookEnglish, Block } from './types'

export function buildSampleReview(doc: BigBookEnglish, seed = 108): string {
  const rng = mulberry32(seed)
  const lines: string[] = []
  lines.push('# EN extraction — sample review')
  lines.push('')
  lines.push(`Seed: ${String(seed)} · Sections: ${String(doc.sections.length)}`)
  lines.push('')

  for (const section of doc.sections) {
    lines.push(`## ${section.id} — ${section.title} (p. ${String(section.bookPageStart)})`)
    lines.push('')
    const samples = pickPairs(section.blocks, 3, rng)
    for (const block of samples) {
      lines.push(`- **\`${block.id}\`** (kind: ${block.kind}, pdfPage ${String(block.pdfPage)})`)
      lines.push('')
      lines.push(`  > ${block.text.replace(/\n/g, '\n  > ')}`)
      lines.push('')
    }
  }
  return lines.join('\n')
}

function mulberry32(seed: number): () => number {
  let s = seed
  return () => {
    s += 0x6d2b79f5
    let t = s
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/**
 * Pick up to `n` pairs of consecutive blocks from `arr`, emitted in document
 * order as a flat list `[arr[s1], arr[s1+1], arr[s2], arr[s2+1], ...]`.
 *
 * - Fallback: if `arr.length < 2`, return all available blocks (no pair possible).
 * - Valid start indices are `[0, arr.length - 2]`.
 * - Starts are chosen via `rng`, deduped, sorted ascending.
 * - Overlapping pairs (e.g., starts `{3,4}` → `(3,4)` and `(4,5)`) are allowed;
 *   the shared neighbor is emitted once per pair, which the markdown renders
 *   as two separate bullets.
 */
function pickPairs(arr: Block[], n: number, rng: () => number): Block[] {
  if (arr.length < 2) return arr
  const maxStart = arr.length - 2
  const validStartCount = maxStart + 1 // starts in [0, maxStart]
  const target = Math.min(n, validStartCount)
  const starts = new Set<number>()
  while (starts.size < target) {
    starts.add(Math.floor(rng() * validStartCount))
  }
  const sorted = Array.from(starts).sort((a, b) => a - b)
  const out: Block[] = []
  for (const s of sorted) {
    const first = arr[s]
    const second = arr[s + 1]
    if (first === undefined || second === undefined) continue
    out.push(first, second)
  }
  return out
}
