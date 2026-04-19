import type {
  BlockKind,
  Extraction,
  ExtractionBlock,
  Pair,
  PairingArtifact,
  UnpairedBlock,
} from '../pair-en-et/types'

export type Group = 'front-matter' | 'chapters' | 'stories' | 'appendices' | 'reader-chrome'

export interface GroupEntry {
  canonicalSlug: string
  group: Group
}

export interface ManifestSection {
  canonicalSlug: string
  group: Group
  title: { en: string; et: string }
  paraIds: readonly string[]
  pdfPageStart: number
  pdfPageEnd: number
}

export interface Manifest {
  version: '1.1'
  generatedAt: string
  sections: readonly ManifestSection[]
}

export interface BoderieCacheEntry {
  sourceText: string
  sourceLang: 'en' | 'et'
  targetLang: 'en' | 'et'
  model: string
  promptVersion: string
  translation: string
  calledAt: string
  usage: { inputTokens: number; outputTokens: number }
}

export type BoderieCache = Record<string, BoderieCacheEntry>

export interface RenderedBlock {
  paraId: string
  kind: BlockKind
  text: string
  isAutoTranslated: boolean
}

export interface SectionRenderPlan {
  canonicalSlug: string
  group: Group
  title: { en: string; et: string }
  pdfPageStart: number
  pdfPageEnd: number
  en: RenderedBlock[]
  et: RenderedBlock[]
}

// Re-exported for convenience so consumers don't need two import lines
export type { BlockKind, Extraction, ExtractionBlock, Pair, PairingArtifact, UnpairedBlock }
