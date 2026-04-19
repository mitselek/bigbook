import { describe, expect, it } from 'vitest'
import { SECTION_MAP } from '../../../scripts/pair-en-et/section-map'
import { GROUP_MAP, groupForSlug, slugsInGroup } from '../../../scripts/bootstrap-content/groups'

describe('GROUP_MAP', () => {
  it('maps every canonical slug in SECTION_MAP to a group', () => {
    const sectionSlugs = SECTION_MAP.map((e) => e.canonicalSlug)
    const groupSlugs = GROUP_MAP.map((e) => e.canonicalSlug).filter(
      (s) => s !== 'cover' && s !== 'index',
    )
    expect(new Set(groupSlugs)).toEqual(new Set(sectionSlugs))
  })

  it('includes cover and index as reader-chrome entries', () => {
    expect(groupForSlug('cover')).toBe('reader-chrome')
    expect(groupForSlug('index')).toBe('reader-chrome')
  })

  it('maps chapter slugs to chapters group', () => {
    for (const slug of ['ch01', 'ch05', 'ch11']) {
      expect(groupForSlug(slug)).toBe('chapters')
    }
  })

  it('maps story slugs to stories group', () => {
    for (const slug of ['s01', 's21', 's42']) {
      expect(groupForSlug(slug)).toBe('stories')
    }
  })

  it('maps appendix slugs to appendices group', () => {
    for (const slug of ['a-i', 'a-iv', 'a-vii', 'a-pamphlets']) {
      expect(groupForSlug(slug)).toBe('appendices')
    }
  })

  it('maps front-matter slugs to front-matter group', () => {
    for (const slug of ['copyright', 'preface', 'fw1', 'fw2', 'fw3', 'fw4', 'arsti']) {
      expect(groupForSlug(slug)).toBe('front-matter')
    }
  })
})

describe('slugsInGroup', () => {
  it('returns exactly 11 chapters', () => {
    expect(slugsInGroup('chapters')).toHaveLength(11)
  })

  it('returns exactly 42 stories', () => {
    expect(slugsInGroup('stories')).toHaveLength(42)
  })

  it('returns exactly 8 appendices', () => {
    expect(slugsInGroup('appendices')).toHaveLength(8)
  })

  it('returns exactly 7 front-matter sections', () => {
    expect(slugsInGroup('front-matter')).toHaveLength(7)
  })

  it('returns exactly 2 reader-chrome entries', () => {
    expect(slugsInGroup('reader-chrome')).toHaveLength(2)
  })
})

describe('groupForSlug', () => {
  it('returns null for unknown slug', () => {
    expect(groupForSlug('not-a-slug')).toBeNull()
  })
})
