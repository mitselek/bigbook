import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { fetchOutline, parseOutlineText } from '../../../scripts/extract-en-book/outline'
import type { OutlineNode } from '../../../scripts/extract-en-book/types'

const FIXTURE = readFileSync(resolve(import.meta.dirname, 'fixtures/outline-sample.txt'), 'utf8')
const FULL_FIXTURE = readFileSync(resolve(import.meta.dirname, 'fixtures/outline-full.txt'), 'utf8')

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

describe('parseOutlineText on full mutool output', () => {
  it('extracts exactly 68 leaf sections', () => {
    const nodes = parseOutlineText(FULL_FIXTURE)
    expect(nodes).toHaveLength(68)
  })

  it('first leaf has expected shape', () => {
    const nodes = parseOutlineText(FULL_FIXTURE)
    expect(nodes[0]).toMatchObject({
      title: 'Copyright Info',
      kind: 'front-matter',
      pdfPageStart: 1,
    })
  })

  it('last leaf has expected shape', () => {
    const nodes = parseOutlineText(FULL_FIXTURE)
    expect(nodes[nodes.length - 1]).toMatchObject({
      title: 'A.A. Pamphlets',
      kind: 'appendix',
      pdfPageStart: 581,
    })
  })
})

describe('fetchOutline', () => {
  it('returns parsed nodes when mutool output is valid', () => {
    const result = fetchOutline(() => FULL_FIXTURE)
    expect(result).toHaveLength(68)
    expect(result[0]).toMatchObject({ title: 'Copyright Info' })
  })

  it('throws a clear error when mutool output is empty', () => {
    expect(() => fetchOutline(() => '')).toThrow(/mutool.*empty|unparseable|outline/i)
  })

  it('throws a clear error when parse returns no leaves', () => {
    expect(() => fetchOutline(() => 'lorem ipsum\n')).toThrow(/mutool.*empty|unparseable|outline/i)
  })
})
