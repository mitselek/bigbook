// Type stub — implementation lands in GREEN (P1.1 Step 3).
// This file exists only so tsc can resolve the import in parse.test.ts.
// Do not add implementation here. (*BB:Montano*)

export type ChapterFrontmatter = {
  chapter: string
  title: string
  lang: 'en' | 'et'
}

export type ParsedChapter = {
  frontmatter: ChapterFrontmatter
  paragraphs: Map<string, string>
}

export type ParseErrorCategory =
  | 'frontmatter_missing'
  | 'frontmatter_malformed'
  | 'directive_malformed'

export class ParseError extends Error {
  constructor(
    public readonly category: ParseErrorCategory,
    message: string,
    public readonly line?: number,
  ) {
    super(message)
    this.name = 'ParseError'
  }
}

export function parse(content: string): ParsedChapter {
  void content
  throw new Error('not implemented')
}
