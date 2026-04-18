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

function computeBodyMargin(lines: string[]): number {
  const widths = lines.filter((l) => l.trim() !== '').map(leadingWhitespaceWidth)
  if (widths.length === 0) return 0
  const counts = new Map<number, number>()
  for (const w of widths) counts.set(w, (counts.get(w) ?? 0) + 1)
  let mode = 0
  let max = 0
  for (const [w, c] of counts) {
    if (c > max) {
      max = c
      mode = w
    }
  }
  return mode
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

  // N1 (calibrated): per-section body-margin detection + uppercase guard.
  // A line is a paragraph start iff its indent exceeds the section's
  // body-margin by 3+ AND its first alphabetic char is uppercase. The
  // first non-blank line of the section is always a paragraph start.
  // N2: collapse the drop-cap whitespace gap on each line.
  const bodyMargin = computeBodyMargin(kept)
  const paragraphIndentThreshold = bodyMargin + 3
  const out: string[] = []
  let seenFirstContent = false
  for (const [i, line] of kept.entries()) {
    const isBlank = line.trim() === ''
    let isParagraphStart = false
    if (!isBlank) {
      if (!seenFirstContent) {
        isParagraphStart = true
        seenFirstContent = true
      } else if (
        leadingWhitespaceWidth(line) >= paragraphIndentThreshold &&
        startsWithUppercaseAlpha(line)
      ) {
        isParagraphStart = true
      }
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
