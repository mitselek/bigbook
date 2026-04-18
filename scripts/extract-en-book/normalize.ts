/**
 * Clean raw pdftotext output: strip running headers, page numbers,
 * running titles, and cross-page paragraph splits.
 */

export interface NormalizeContext {
  sectionTitle: string
}

const QXD_HEADER = /^Alco_\w+_\d+p_\w+_r\d+\.qxd .+Page \d+$/
const PAGE_NUMBER_LINE = /^\s*\d{1,3}\s*$/
const PAGE_AND_TITLE = /^\s*\d{1,3}\s+[A-Z][A-Z .'\u2019-]+\s*$/
const BOOK_TITLE_LINE = /^\s*ALCOHOLICS ANONYMOUS\s*$/

export function normalize(raw: string, ctx: NormalizeContext): string {
  const lines = raw.split('\n')
  const sectionTitleUpper = ctx.sectionTitle.toUpperCase()
  const kept: string[] = []

  for (const line of lines) {
    if (QXD_HEADER.test(line)) continue
    if (PAGE_NUMBER_LINE.test(line)) continue
    if (BOOK_TITLE_LINE.test(line)) continue
    if (PAGE_AND_TITLE.test(line)) continue
    if (line.trim().toUpperCase() === sectionTitleUpper) continue
    kept.push(line)
  }

  return kept.join('\n')
}
