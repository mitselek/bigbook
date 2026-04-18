/**
 * Parse the output of `mutool show <pdf> outline` into a flat list of
 * leaf OutlineNodes. Intermediate grouping nodes (Pre Chapters, Chapters,
 * Pioneers of A.A., etc.) are consumed to assign `kind` and `parentGroup`
 * to the leaves.
 */

import type { OutlineNode, SectionKind } from './types'

interface GroupState {
  name: string
  kind: SectionKind
  parentGroup?: string
}

const GROUP_RULES: Record<string, GroupState> = {
  'Pre Chapters': { name: 'Pre Chapters', kind: 'front-matter' },
  Chapters: { name: 'Chapters', kind: 'chapter' },
  'Pioneers of A.A.': {
    name: 'Pioneers of A.A.',
    kind: 'story',
    parentGroup: 'personal-stories/pioneers-of-aa',
  },
  'They Stopped in Time': {
    name: 'They Stopped in Time',
    kind: 'story',
    parentGroup: 'personal-stories/they-stopped-in-time',
  },
  'They Lost Nearly All': {
    name: 'They Lost Nearly All',
    kind: 'story',
    parentGroup: 'personal-stories/they-lost-nearly-all',
  },
  Appendices: { name: 'Appendices', kind: 'appendix' },
}

const PRE_CHAPTER_KIND_BY_TITLE: Record<string, SectionKind> = {
  'Copyright Info': 'front-matter',
  Preface: 'preface',
  'Foreword to First': 'foreword',
  'Foreword to Second': 'foreword',
  'Foreword to Third': 'foreword',
  'Foreword to Fourth': 'foreword',
  'The Doctors Opinion': 'doctors-opinion',
}

export function parseOutlineText(raw: string): OutlineNode[] {
  const nodes: OutlineNode[] = []
  let currentGroup: GroupState | null = null

  for (const line of raw.split('\n')) {
    const match = line.match(/^([+|])\s*(\t*)"([^"]+)"\s*#page=(\d+)/)
    if (!match) continue
    const marker = match[1]
    const tabs = match[2]
    const title = match[3]
    const pageStr = match[4]
    if (
      marker === undefined ||
      tabs === undefined ||
      title === undefined ||
      pageStr === undefined
    ) {
      continue
    }
    const pdfPageStart = Number(pageStr)
    const depth = tabs.length

    if (marker === '+' && depth === 0) {
      currentGroup = GROUP_RULES[title] ?? null
      continue
    }

    if (!currentGroup) {
      throw new Error(`Leaf outline node seen before any group header: "${title}"`)
    }

    let kind: SectionKind = currentGroup.kind
    if (currentGroup.name === 'Pre Chapters') {
      kind = PRE_CHAPTER_KIND_BY_TITLE[title] ?? 'front-matter'
    }

    const leaf: OutlineNode = { title, kind, pdfPageStart }
    if (currentGroup.parentGroup) {
      leaf.parentGroup = currentGroup.parentGroup
    }
    nodes.push(leaf)
  }

  return nodes
}
