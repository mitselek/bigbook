import { describe, expect, it } from 'vitest'
import { kebabCase, sectionIdFor } from '../../../scripts/extract-en-book/slug'
import type { OutlineNode } from '../../../scripts/extract-en-book/types'

describe('kebabCase', () => {
  it('lowercases ASCII words', () => {
    expect(kebabCase('Preface')).toBe('preface')
  })

  it('joins whitespace-separated words with hyphens', () => {
    expect(kebabCase('A Vision For You')).toBe('a-vision-for-you')
  })

  it('strips punctuation except digits and hyphens', () => {
    expect(kebabCase("Bill's Story")).toBe('bills-story')
    expect(kebabCase('Physician, Heal Thyself!')).toBe('physician-heal-thyself')
  })

  it('collapses internal whitespace runs', () => {
    expect(kebabCase('Dr.   Bob\u2019s  Nightmare')).toBe('dr-bobs-nightmare')
  })

  it('strips leading and trailing hyphens', () => {
    expect(kebabCase('- hello -')).toBe('hello')
  })

  it('preserves digits', () => {
    expect(kebabCase('A.A. Number Three')).toBe('aa-number-three')
  })
})

describe('sectionIdFor', () => {
  function node(
    partial: Partial<OutlineNode> & { title: string; kind: OutlineNode['kind'] },
  ): OutlineNode {
    return { pdfPageStart: 1, ...partial }
  }

  it('maps front-matter titles directly', () => {
    expect(
      sectionIdFor(node({ title: 'Copyright Info', kind: 'front-matter' }), { chapterOrdinal: 0 }),
    ).toBe('copyright-info')
  })

  it('maps the preface', () => {
    expect(sectionIdFor(node({ title: 'Preface', kind: 'preface' }), { chapterOrdinal: 0 })).toBe(
      'preface',
    )
  })

  it('maps forewords by edition ordinal', () => {
    expect(
      sectionIdFor(node({ title: 'Foreword to First', kind: 'foreword' }), { chapterOrdinal: 0 }),
    ).toBe('foreword-1st-edition')
    expect(
      sectionIdFor(node({ title: 'Foreword to Second', kind: 'foreword' }), { chapterOrdinal: 0 }),
    ).toBe('foreword-2nd-edition')
    expect(
      sectionIdFor(node({ title: 'Foreword to Third', kind: 'foreword' }), { chapterOrdinal: 0 }),
    ).toBe('foreword-3rd-edition')
    expect(
      sectionIdFor(node({ title: 'Foreword to Fourth', kind: 'foreword' }), { chapterOrdinal: 0 }),
    ).toBe('foreword-4th-edition')
  })

  it('maps doctors opinion', () => {
    expect(
      sectionIdFor(node({ title: 'The Doctors Opinion', kind: 'doctors-opinion' }), {
        chapterOrdinal: 0,
      }),
    ).toBe('doctors-opinion')
  })

  it('prefixes chapters with chNN-', () => {
    expect(
      sectionIdFor(node({ title: "Bill's Story", kind: 'chapter' }), { chapterOrdinal: 1 }),
    ).toBe('ch01-bills-story')
    expect(
      sectionIdFor(node({ title: 'A Vision For You', kind: 'chapter' }), { chapterOrdinal: 11 }),
    ).toBe('ch11-a-vision-for-you')
  })

  it('prefixes stories with story-', () => {
    expect(
      sectionIdFor(node({ title: "Dr. Bob's Nightmare", kind: 'story' }), { chapterOrdinal: 0 }),
    ).toBe('story-dr-bobs-nightmare')
  })

  it('prefixes appendices with roman numeral', () => {
    expect(
      sectionIdFor(node({ title: 'I The A.A. Tradition', kind: 'appendix' }), {
        chapterOrdinal: 0,
      }),
    ).toBe('appendix-i-the-aa-tradition')
    expect(
      sectionIdFor(node({ title: 'VII The Twelve Concepts', kind: 'appendix' }), {
        chapterOrdinal: 0,
      }),
    ).toBe('appendix-vii-the-twelve-concepts')
  })

  it('special-cases A.A. Pamphlets', () => {
    expect(
      sectionIdFor(node({ title: 'A.A. Pamphlets', kind: 'appendix' }), { chapterOrdinal: 0 }),
    ).toBe('appendix-aa-pamphlets')
  })
})
