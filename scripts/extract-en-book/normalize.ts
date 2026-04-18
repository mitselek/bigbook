/**
 * Clean raw pdftotext output: strip running headers, page numbers,
 * running titles, and cross-page paragraph splits.
 */

export interface NormalizeContext {
  sectionTitle: string
}

const QXD_HEADER = /^\s*Alco_\w+_\d+p_\w+_r\d+\.qxd .+Page \d+$/
const PAGE_NUMBER_LINE = /^\s*\d{1,3}\s*$/
const PAGE_AND_TITLE = /^\s*\d{1,3}\s+[A-Z][A-Z .'\u2019-]+\s*$/
const TITLE_AND_PAGE = /^\s*[A-Z][A-Z .'\u2019-]+\s+\d{1,3}\s*$/
const BOOK_TITLE_LINE = /^\s*ALCOHOLICS ANONYMOUS\s*$/
const PAGE_ARTIFACTS = [
  QXD_HEADER,
  PAGE_NUMBER_LINE,
  BOOK_TITLE_LINE,
  PAGE_AND_TITLE,
  TITLE_AND_PAGE,
]
const DROP_CAP = /^([A-Z])\s{2,}([a-z])/

function leadingWhitespaceWidth(line: string): number {
  const match = line.match(/^\s*/)
  return match ? match[0].length : 0
}

function startsWithUppercaseAlpha(line: string): boolean {
  const stripped = line.replace(
    /^[\s\d.,;:!?()[\]{}'"\u2018\u2019\u201c\u201d\u2013\u2014`*-]+/,
    '',
  )
  const first = stripped.charAt(0)
  return first >= 'A' && first <= 'Z'
}

export function normalize(raw: string, _ctx: NormalizeContext): string {
  const lines = raw.split('\n')

  // Pass 1: mark lines that are page-break artifacts
  const strip: boolean[] = lines.map((line) => PAGE_ARTIFACTS.some((re) => re.test(line)))

  // Pass 2: propagate — runs of blank lines adjacent to a stripped line are
  // part of the page-break artifact and must be dropped. A blank-run between
  // two kept (non-stripped, non-blank) lines is a legitimate paragraph break
  // and must be preserved.
  //
  // Walk forward from each stripped line, marking following blanks stripped
  // until a non-blank is reached. Then walk backward similarly.
  for (const [i] of lines.entries()) {
    if (!strip[i]) continue
    // forward
    for (let j = i + 1; j < lines.length; j++) {
      const next = lines[j]
      if (next === undefined || next.trim() !== '') break
      strip[j] = true
    }
    // backward
    for (let j = i - 1; j >= 0; j--) {
      const prev = lines[j]
      if (prev === undefined || prev.trim() !== '') break
      strip[j] = true
    }
  }

  const kept = lines.filter((_, i) => !strip[i])

  // N1 (local-delta): a line is a paragraph start iff its indent exceeds
  // the preceding non-blank line's indent by 3+ AND its first alphabetic
  // char is uppercase. This handles sections with multiple body margins
  // (book-layout left/right pages) without a per-section statistic.
  // First non-blank line of the section is always a paragraph start.
  // N2: collapse the drop-cap whitespace gap on each line.
  const out: string[] = []
  let seenFirstContent = false
  let lastNonBlankIndent = 0
  for (const [i, line] of kept.entries()) {
    const isBlank = line.trim() === ''
    let isParagraphStart = false
    if (!isBlank) {
      const currentIndent = leadingWhitespaceWidth(line)
      if (!seenFirstContent) {
        isParagraphStart = true
        seenFirstContent = true
      } else if (currentIndent >= lastNonBlankIndent + 3 && startsWithUppercaseAlpha(line)) {
        isParagraphStart = true
      }
      lastNonBlankIndent = currentIndent
    }
    if (isParagraphStart && i > 0) {
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
