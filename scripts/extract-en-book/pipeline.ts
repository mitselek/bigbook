/**
 * Orchestrator — wire slug + pdftotext + normalize + segment into a BookSection.
 */

import { normalize } from './normalize'
import { extractPages } from './pdftotext'
import { segmentBlocks } from './segment'
import { sectionIdFor } from './slug'
import type { BookSection, OutlineNode } from './types'

export interface BuildSectionInput {
  node: OutlineNode
  chapterOrdinal: number
  pdfPath: string
  pdfPageEnd: number
  bookPageStart: number
  bookPageEnd: number
}

export function buildBookSection(input: BuildSectionInput): BookSection {
  const { node, chapterOrdinal, pdfPath, pdfPageEnd, bookPageStart, bookPageEnd } = input
  const id = sectionIdFor(node, { chapterOrdinal })
  const raw = extractPages(pdfPath, node.pdfPageStart, pdfPageEnd)
  const normalized = normalize(raw, { sectionTitle: node.title })
  const blocks = segmentBlocks(normalized, {
    sectionTitle: node.title,
    sectionId: id,
    pdfPageStart: node.pdfPageStart,
  })

  const section: BookSection = {
    id,
    kind: node.kind,
    title: node.title,
    pdfPageStart: node.pdfPageStart,
    pdfPageEnd,
    bookPageStart,
    bookPageEnd,
    blocks,
  }
  if (node.parentGroup !== undefined) section.parentGroup = node.parentGroup
  return section
}
