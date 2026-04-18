import type { OutlineNode } from './types'

export function kebabCase(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

export interface SlugContext {
  chapterOrdinal: number
}

const FOREWORD_EDITION: Record<string, string> = {
  first: '1st',
  second: '2nd',
  third: '3rd',
  fourth: '4th',
}

export function sectionIdFor(node: OutlineNode, ctx: SlugContext): string {
  const title = node.title.trim()
  const slug = kebabCase(title)

  switch (node.kind) {
    case 'front-matter':
    case 'preface':
      return slug
    case 'doctors-opinion':
      return 'doctors-opinion'
    case 'foreword': {
      const match = title.match(/Foreword to (\w+)/i)
      const word = match?.[1]?.toLowerCase() ?? ''
      const edition = FOREWORD_EDITION[word]
      if (!edition) {
        throw new Error(`Unrecognized foreword title: ${title}`)
      }
      return `foreword-${edition}-edition`
    }
    case 'chapter': {
      const n = String(ctx.chapterOrdinal).padStart(2, '0')
      return `ch${n}-${slug}`
    }
    case 'story':
      return `story-${slug}`
    case 'appendix': {
      if (/^a\.?a\.?\s+pamphlets$/i.test(title)) {
        return 'appendix-aa-pamphlets'
      }
      const match = title.match(/^([IVX]+)\s+(.*)$/i)
      if (!match) {
        throw new Error(`Unrecognized appendix title: ${title}`)
      }
      const roman = (match[1] ?? '').toLowerCase()
      const rest = kebabCase(match[2] ?? '')
      return `appendix-${roman}-${rest}`
    }
  }
}
