import { parse } from './parse'
import type { ParsedChapter } from './parse'

export function serialize(chapter: ParsedChapter): string {
  const { frontmatter: fm, paragraphs } = chapter
  const lines: string[] = [
    '---',
    `chapter: ${fm.chapter}`,
    `title: ${fm.title}`,
    `lang: ${fm.lang}`,
    '---',
  ]

  for (const [id, text] of paragraphs) {
    lines.push('', `::para[${id}]`, '', text)
  }

  lines.push('')
  return lines.join('\n')
}

export function replaceParaText(content: string, paraId: string, newText: string): string {
  const chapter = parse(content)
  if (!chapter.paragraphs.has(paraId)) {
    throw new Error(`para-id '${paraId}' not found in chapter`)
  }
  chapter.paragraphs.set(paraId, newText)
  return serialize(chapter)
}
