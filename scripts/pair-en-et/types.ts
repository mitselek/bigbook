export type BlockKind =
  | 'paragraph'
  | 'heading'
  | 'list-item'
  | 'blockquote'
  | 'verse'
  | 'table'
  | 'byline'
  | 'footnote'

export interface ExtractionBlock {
  id: string
  kind: BlockKind
  text: string
  pdfPage: number
}

export interface ExtractionSection {
  id: string
  kind: string
  title: string
  pdfPageStart: number
  pdfPageEnd: number
  bookPageStart: number
  bookPageEnd: number
  blocks: ExtractionBlock[]
}

export interface Extraction {
  edition: string
  sourcePdf: string
  extractedAt: string
  sections: ExtractionSection[]
}

export type Confidence = 'high' | 'low'

export type UnpairedReason =
  | 'structural-extra'
  | 'section-en-only'
  | 'section-et-only'
  | 'needs-review'

export type UnpairedSectionReason = 'section-en-only' | 'section-et-only'

export interface Pair {
  paraId: string
  kind: BlockKind
  enBlockId: string | string[]
  etBlockId: string | string[]
  confidence: Confidence
  notes?: string
}

export interface UnpairedBlock {
  blockId: string
  side: 'en' | 'et'
  kind: BlockKind
  reason: UnpairedReason
  notes?: string
}

export interface SectionPair {
  canonicalSlug: string
  enSectionId: string
  etSectionId: string
  pairs: Pair[]
  unpaired: UnpairedBlock[]
  diagnostics: string[]
}

export interface UnpairedSection {
  side: 'en' | 'et'
  sectionId: string
  canonicalSlug: string
  reason: UnpairedSectionReason
  blockCount: number
}

export interface PairingArtifact {
  version: '1.0'
  generatedAt: string
  sourceEn: { path: string; sha256: string; blockCount: number }
  sourceEt: { path: string; sha256: string; blockCount: number }
  sections: SectionPair[]
  unpairedSections: UnpairedSection[]
}
