import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { parseOutlineText } from '../../../scripts/extract-en-book/outline'
import type { OutlineNode } from '../../../scripts/extract-en-book/types'

const FIXTURE = readFileSync(resolve(import.meta.dirname, 'fixtures/outline-sample.txt'), 'utf8')

describe('parseOutlineText', () => {
  it('extracts all leaf sections with correct kind', () => {
    const nodes = parseOutlineText(FIXTURE)
    const titles = nodes.map((n) => n.title)
    expect(titles).toEqual([
      'Copyright Info',
      'Preface',
      'Foreword to First',
      'Foreword to Fourth',
      'The Doctors Opinion',
      "Bill's Story",
      'A Vision For You',
      "Dr. Bob's Nightmare",
      'The Missing Link',
      'My Bottle, My Resentments, and Me',
      'I The A.A. Tradition',
      'A.A. Pamphlets',
    ])
  })

  it('assigns kind based on parent group', () => {
    const nodes = parseOutlineText(FIXTURE)
    const byTitle = new Map<string, OutlineNode>(nodes.map((n) => [n.title, n]))
    expect(byTitle.get('Copyright Info')).toMatchObject({ kind: 'front-matter' })
    expect(byTitle.get('Preface')).toMatchObject({ kind: 'preface' })
    expect(byTitle.get('Foreword to First')).toMatchObject({ kind: 'foreword' })
    expect(byTitle.get('The Doctors Opinion')).toMatchObject({ kind: 'doctors-opinion' })
    expect(byTitle.get("Bill's Story")).toMatchObject({ kind: 'chapter' })
    expect(byTitle.get("Dr. Bob's Nightmare")).toMatchObject({ kind: 'story' })
    expect(byTitle.get('I The A.A. Tradition')).toMatchObject({ kind: 'appendix' })
    expect(byTitle.get('A.A. Pamphlets')).toMatchObject({ kind: 'appendix' })
  })

  it('assigns parentGroup only to stories', () => {
    const nodes = parseOutlineText(FIXTURE)
    const byTitle = new Map<string, OutlineNode>(nodes.map((n) => [n.title, n]))
    expect(byTitle.get("Dr. Bob's Nightmare")).toMatchObject({
      parentGroup: 'personal-stories/pioneers-of-aa',
    })
    expect(byTitle.get('The Missing Link')).toMatchObject({
      parentGroup: 'personal-stories/they-stopped-in-time',
    })
    expect(byTitle.get('My Bottle, My Resentments, and Me')).toMatchObject({
      parentGroup: 'personal-stories/they-lost-nearly-all',
    })
    expect(byTitle.get("Bill's Story")?.parentGroup).toBeUndefined()
    expect(byTitle.get('I The A.A. Tradition')?.parentGroup).toBeUndefined()
  })

  it('extracts pdfPageStart from page anchor', () => {
    const nodes = parseOutlineText(FIXTURE)
    const byTitle = new Map<string, OutlineNode>(nodes.map((n) => [n.title, n]))
    expect(byTitle.get('Copyright Info')).toMatchObject({ pdfPageStart: 1 })
    expect(byTitle.get("Bill's Story")).toMatchObject({ pdfPageStart: 22 })
    expect(byTitle.get('A.A. Pamphlets')).toMatchObject({ pdfPageStart: 581 })
  })
})
