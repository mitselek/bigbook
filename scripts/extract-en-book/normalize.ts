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
const TITLE_AND_PAGE = /^\s*[A-Z][A-Z .'\u2019-]+\s+\d{1,3}\s*$/
const BOOK_TITLE_LINE = /^\s*ALCOHOLICS ANONYMOUS\s*$/
const DROP_CAP = /^([A-Z])\s{2,}([a-z])/
const INDENT_START = /^\s{3,}\S/

export function normalize(raw: string, _ctx: NormalizeContext): string {
  const lines = raw.split('\n')

  // Pass 1: mark lines that are page-break artifacts
  const strip: boolean[] = lines.map((line) => {
    if (QXD_HEADER.test(line)) return true
    if (PAGE_NUMBER_LINE.test(line)) return true
    if (BOOK_TITLE_LINE.test(line)) return true
    if (PAGE_AND_TITLE.test(line)) return true
    if (TITLE_AND_PAGE.test(line)) return true
    return false
  })

  // Pass 2: propagate — a blank line adjacent to a stripped line is itself
  // part of the page-break artifact and must be dropped. A blank line between
  // two kept (non-stripped, non-blank) lines is a legitimate paragraph break
  // and must be preserved.
  for (const [i, line] of lines.entries()) {
    if (strip[i]) continue
    if (line.trim() !== '') continue
    const prevStripped = i > 0 && strip[i - 1] === true
    const nextStripped = i < lines.length - 1 && strip[i + 1] === true
    if (prevStripped || nextStripped) strip[i] = true
  }

  const kept = lines.filter((_, i) => !strip[i])

  // N1: insert a blank line before any line that begins with 3+ spaces.
  // Layout-mode output uses leading indent to mark a new paragraph start.
  // N2: collapse the drop-cap whitespace gap on each line.
  const out: string[] = []
  for (const [i, line] of kept.entries()) {
    if (i > 0 && INDENT_START.test(line)) {
      const prev = out[out.length - 1] ?? ''
      if (prev.trim() !== '') out.push('')
    }
    out.push(line.replace(DROP_CAP, '$1$2'))
  }

  return rejoinHyphens(out.join('\n'))
}

function rejoinHyphens(text: string): string {
  return text.replace(/([a-z]+)-\n\s*\n?\s*([a-z]+)/g, (_, a: string, b: string) => `${a}${b}`)
}
