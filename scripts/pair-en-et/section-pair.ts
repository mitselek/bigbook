import { SECTION_MAP, slugForEnSection, slugForEtSection } from './section-map'
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

export function pairSections(en: Extraction, et: Extraction): PairSectionsResult {
  const enBySlug = new Map<string, ExtractionSection>()
  const etBySlug = new Map<string, ExtractionSection>()

  for (const section of en.sections) {
    const slug = slugForEnSection(section.id)
    if (slug === null) {
      throw new Error(`EN section ${section.id} has no canonical slug mapping`)
    }
    enBySlug.set(slug, section)
  }
  for (const section of et.sections) {
    const slug = slugForEtSection(section.id)
    if (slug === null) {
      throw new Error(`ET section ${section.id} has no canonical slug mapping`)
    }
    etBySlug.set(slug, section)
  }

  const sectionPairs: PairSectionsResult['sectionPairs'] = []
  const unpairedSections: UnpairedSection[] = []

  for (const entry of SECTION_MAP) {
    const enSection = enBySlug.get(entry.canonicalSlug)
    const etSection = etBySlug.get(entry.canonicalSlug)

    if (enSection !== undefined && etSection !== undefined) {
      sectionPairs.push({
        canonicalSlug: entry.canonicalSlug,
        enSectionId: enSection.id,
        etSectionId: etSection.id,
        enSection,
        etSection,
      })
    } else if (enSection !== undefined && etSection === undefined) {
      unpairedSections.push({
        side: 'en',
        sectionId: enSection.id,
        canonicalSlug: entry.canonicalSlug,
        reason: entry.etSectionId === null ? 'section-en-only' : 'section-et-only',
        blockCount: enSection.blocks.length,
      })
    } else if (enSection === undefined && etSection !== undefined) {
      unpairedSections.push({
        side: 'et',
        sectionId: etSection.id,
        canonicalSlug: entry.canonicalSlug,
        reason: 'section-en-only',
        blockCount: etSection.blocks.length,
      })
    }
  }

  return { sectionPairs, unpairedSections }
}
