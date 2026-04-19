import type { BlockKind } from './types'

export interface SectionMapEntry {
  canonicalSlug: string
  enSectionId: string | null
  etSectionId: string | null
}

export const SECTION_MAP: readonly SectionMapEntry[] = []

export function slugForEnSection(_enId: string): string | null {
  return null
}

export function slugForEtSection(_etId: string): string | null {
  return null
}

export function entryForSlug(_slug: string): SectionMapEntry | null {
  return null
}

// Silence unused-import lint until wired up
export const __blockKindWitness: BlockKind = 'paragraph'
