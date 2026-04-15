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

const FRONTMATTER_RE = /^---\n([\s\S]*?)\n---\n?([\s\S]*)$/

export function parse(content: string): ParsedChapter {
  const match = content.match(FRONTMATTER_RE)
  if (!match) {
    throw new ParseError('frontmatter_missing', 'file must begin with a YAML frontmatter block')
  }
  const frontmatterBlock = match[1] ?? ''
  const frontmatter = parseFrontmatter(frontmatterBlock)
  return {
    frontmatter,
    paragraphs: new Map(),
  }
}

function parseFrontmatter(block: string): ChapterFrontmatter {
  const entries = new Map<string, string>()
  for (const line of block.split('\n')) {
    const m = line.match(/^(\w+):\s*(.*)$/)
    if (!m) continue
    const key = m[1]
    const val = m[2]
    if (key === undefined || val === undefined) continue
    entries.set(key, val.trim())
  }
  const chapter = entries.get('chapter') ?? ''
  const title = entries.get('title') ?? ''
  const lang = entries.get('lang') ?? ''
  if (lang !== 'en' && lang !== 'et') {
    throw new ParseError('frontmatter_malformed', `lang must be 'en' or 'et', got '${lang}'`)
  }
  return { chapter, title, lang }
}
