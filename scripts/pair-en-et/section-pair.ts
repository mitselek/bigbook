import type { Extraction, ExtractionSection, UnpairedSection } from './types'

export interface PairSectionsResult {
  sectionPairs: {
    canonicalSlug: string
    enSectionId: string
    etSectionId: string
    enSection: ExtractionSection
    etSection: ExtractionSection
  }[]
  unpairedSections: UnpairedSection[]
}

export function pairSections(_en: Extraction, _et: Extraction): PairSectionsResult {
  return { sectionPairs: [], unpairedSections: [] }
}
