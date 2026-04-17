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
