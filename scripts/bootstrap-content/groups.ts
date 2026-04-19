import type { Group, GroupEntry } from './types'

export const GROUP_MAP: readonly GroupEntry[] = [
  { canonicalSlug: 'cover', group: 'reader-chrome' },
  { canonicalSlug: 'index', group: 'reader-chrome' },

  { canonicalSlug: 'copyright', group: 'front-matter' },
  { canonicalSlug: 'preface', group: 'front-matter' },
  { canonicalSlug: 'fw1', group: 'front-matter' },
  { canonicalSlug: 'fw2', group: 'front-matter' },
  { canonicalSlug: 'fw3', group: 'front-matter' },
  { canonicalSlug: 'fw4', group: 'front-matter' },
  { canonicalSlug: 'arsti', group: 'front-matter' },

  { canonicalSlug: 'ch01', group: 'chapters' },
  { canonicalSlug: 'ch02', group: 'chapters' },
  { canonicalSlug: 'ch03', group: 'chapters' },
  { canonicalSlug: 'ch04', group: 'chapters' },
  { canonicalSlug: 'ch05', group: 'chapters' },
  { canonicalSlug: 'ch06', group: 'chapters' },
  { canonicalSlug: 'ch07', group: 'chapters' },
  { canonicalSlug: 'ch08', group: 'chapters' },
  { canonicalSlug: 'ch09', group: 'chapters' },
  { canonicalSlug: 'ch10', group: 'chapters' },
  { canonicalSlug: 'ch11', group: 'chapters' },

  ...Array.from({ length: 42 }, (_, i) => ({
    canonicalSlug: `s${String(i + 1).padStart(2, '0')}`,
    group: 'stories' as const,
  })),

  { canonicalSlug: 'a-i', group: 'appendices' },
  { canonicalSlug: 'a-ii', group: 'appendices' },
  { canonicalSlug: 'a-iii', group: 'appendices' },
  { canonicalSlug: 'a-iv', group: 'appendices' },
  { canonicalSlug: 'a-v', group: 'appendices' },
  { canonicalSlug: 'a-vi', group: 'appendices' },
  { canonicalSlug: 'a-vii', group: 'appendices' },
  { canonicalSlug: 'a-pamphlets', group: 'appendices' },
]

const slugIndex = new Map(GROUP_MAP.map((e) => [e.canonicalSlug, e.group]))

export function groupForSlug(slug: string): Group | null {
  return slugIndex.get(slug) ?? null
}

export function slugsInGroup(group: Group): readonly string[] {
  return GROUP_MAP.filter((e) => e.group === group).map((e) => e.canonicalSlug)
}
