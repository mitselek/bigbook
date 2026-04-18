export type SectionKind =
  | 'front-matter'
  | 'preface'
  | 'foreword'
  | 'doctors-opinion'
  | 'chapter'
  | 'story'
  | 'appendix'

export type BlockKind = 'heading' | 'paragraph' | 'blockquote' | 'verse' | 'list-item' | 'footnote'

export interface Block {
  id: string
  kind: BlockKind
  text: string
  pdfPage: number
}

export interface BookSection {
  id: string
  kind: SectionKind
  title: string
  parentGroup?: string
  pdfPageStart: number
  pdfPageEnd: number
  bookPageStart: number
  bookPageEnd: number
  blocks: Block[]
}

export interface BigBookEnglish {
  edition: '4th'
  sourcePdf: string
  extractedAt: string
  sections: BookSection[]
}

export interface OutlineNode {
  title: string
  kind: SectionKind
  parentGroup?: string
  pdfPageStart: number
}
