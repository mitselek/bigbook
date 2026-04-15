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
  /* v8 ignore next */
  const frontmatterBlock = match[1] ?? ''
  /* v8 ignore next */
  const body = match[2] ?? ''
  const frontmatter = parseFrontmatter(frontmatterBlock)
  return {
    frontmatter,
    paragraphs: parseBody(body),
  }
}

function parseFrontmatter(block: string): ChapterFrontmatter {
  const entries = new Map<string, string>()
  for (const line of block.split('\n')) {
    const m = line.match(/^(\w+):\s*(.*)$/)
    if (!m) continue
    const key = m[1]
    const val = m[2]
    /* v8 ignore next */
    if (key === undefined || val === undefined) continue
    entries.set(key, val.trim())
  }
  const chapter = entries.get('chapter')
  const title = entries.get('title')
  const lang = entries.get('lang')

  if (!chapter) {
    throw new ParseError('frontmatter_malformed', 'frontmatter is missing required field: chapter')
  }
  if (!title) {
    throw new ParseError('frontmatter_malformed', 'frontmatter is missing required field: title')
  }
  if (lang !== 'en' && lang !== 'et') {
    throw new ParseError(
      'frontmatter_malformed',
      `frontmatter.lang must be 'en' or 'et', got '${lang ?? '(missing)'}'`,
    )
  }
  return { chapter, title, lang }
}

const DIRECTIVE_RE = /^::para\[([^\]]+)\]$/
const DIRECTIVE_PREFIX_RE = /^::para\[/

function parseBody(body: string): Map<string, string> {
  const paragraphs = new Map<string, string>()
  const lines = body.split('\n')
  let currentId: string | null = null
  let currentLines: string[] = []

  const flush = () => {
    if (currentId !== null) {
      paragraphs.set(currentId, currentLines.join('\n').trim())
    }
  }

  lines.forEach((line, index) => {
    const directive = line.match(DIRECTIVE_RE)
    if (directive) {
      flush()
      /* v8 ignore next */
      currentId = directive[1] ?? null
      currentLines = []
      return
    }
    if (DIRECTIVE_PREFIX_RE.test(line)) {
      throw new ParseError(
        'directive_malformed',
        `malformed ::para[] directive: ${JSON.stringify(line)}`,
        index + 1,
      )
    }
    if (currentId !== null) {
      currentLines.push(line)
    }
  })
  flush()

  return paragraphs
}
