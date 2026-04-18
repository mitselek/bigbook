/**
 * Produce a markdown report with 3 random blocks per section for PO proofreading.
 */

import type { BigBookEnglish } from './types'

export function buildSampleReview(doc: BigBookEnglish, seed = 42): string {
  const rng = mulberry32(seed)
  const lines: string[] = []
  lines.push('# EN extraction — sample review')
  lines.push('')
  lines.push(`Seed: ${String(seed)} · Sections: ${String(doc.sections.length)}`)
  lines.push('')

  for (const section of doc.sections) {
    lines.push(`## ${section.id} — ${section.title} (p. ${String(section.bookPageStart)})`)
    lines.push('')
    const samples = pickN(section.blocks, 3, rng)
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

function pickN<T>(arr: T[], n: number, rng: () => number): T[] {
  if (arr.length <= n) return arr
  const indices = new Set<number>()
  while (indices.size < n) {
    indices.add(Math.floor(rng() * arr.length))
  }
  return arr.filter((_, i) => indices.has(i))
}
