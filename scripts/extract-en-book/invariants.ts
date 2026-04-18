/**
 * Runtime invariants for a BigBookEnglish extraction result.
 */

import type { BigBookEnglish } from './types'

const SHORT_SECTION_ALLOWLIST = new Set(['copyright-info', 'appendix-aa-pamphlets'])

export function validateExtraction(doc: BigBookEnglish): void {
  const seenSectionIds = new Set<string>()

  for (const section of doc.sections) {
    if (seenSectionIds.has(section.id)) {
      throw new Error(`duplicate section id: ${section.id}`)
    }
    seenSectionIds.add(section.id)

    if (section.pdfPageStart > section.pdfPageEnd) {
      throw new Error(
        `invalid page range for ${section.id}: ${String(section.pdfPageStart)} > ${String(section.pdfPageEnd)}`,
      )
    }

    if (section.blocks.length === 0 && !SHORT_SECTION_ALLOWLIST.has(section.id)) {
      throw new Error(`zero blocks in section ${section.id}`)
    }

    const seenBlockIds = new Set<string>()
    for (const block of section.blocks) {
      if (seenBlockIds.has(block.id)) {
        throw new Error(`duplicate block id: ${block.id}`)
      }
      seenBlockIds.add(block.id)

      if (block.text.trim().length === 0) {
        throw new Error(`empty text in block ${block.id}`)
      }

      if (block.pdfPage < section.pdfPageStart || block.pdfPage > section.pdfPageEnd) {
        throw new Error(
          `block ${block.id} pdfPage ${String(block.pdfPage)} outside section range ` +
            `${String(section.pdfPageStart)}-${String(section.pdfPageEnd)}`,
        )
      }
    }
  }
}
