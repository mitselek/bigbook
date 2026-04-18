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

export function sectionIdFor(_node: OutlineNode, _ctx: SlugContext): string {
  throw new Error('not implemented')
}
