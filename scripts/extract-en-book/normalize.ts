/**
 * Clean raw pdftotext output: strip running headers, page numbers,
 * running titles, and cross-page paragraph splits.
 */

export interface NormalizeContext {
  sectionTitle: string
}

export function normalize(_raw: string, _ctx: NormalizeContext): string {
  throw new Error('not implemented')
}
