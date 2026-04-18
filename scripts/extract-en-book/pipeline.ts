/**
 * Orchestrator — wire slug + pdftotext + normalize + segment into a BookSection.
 */

import type { BookSection, OutlineNode } from './types'

export interface BuildSectionInput {
  node: OutlineNode
  chapterOrdinal: number
  pdfPath: string
  pdfPageEnd: number
  bookPageStart: number
  bookPageEnd: number
}

export function buildBookSection(_input: BuildSectionInput): BookSection {
  throw new Error('buildBookSection not implemented')
}
