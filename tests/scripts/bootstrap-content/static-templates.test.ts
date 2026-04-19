import { describe, expect, it } from 'vitest'
import {
  renderCover,
  renderIndex,
  shouldRegenerateCover,
  COVER_MARKER,
} from '../../../scripts/bootstrap-content/static-templates'
import type { Manifest } from '../../../scripts/bootstrap-content/types'

describe('renderCover', () => {
  it('emits EN cover with English title and subtitle', () => {
    const out = renderCover('en')
    expect(out).toContain('# Alcoholics Anonymous')
    expect(out).toContain('Fourth Edition')
    expect(out).toContain(COVER_MARKER)
  })

  it('emits ET cover with Estonian title and subtitle', () => {
    const out = renderCover('et')
    expect(out).toContain('# Anonüümsed Alkohoolikud')
    expect(out).toContain('Neljas väljaanne')
    expect(out).toContain(COVER_MARKER)
  })
})

describe('shouldRegenerateCover', () => {
  it('returns true when file does not exist (regenerate=emit initial)', () => {
    expect(shouldRegenerateCover(null)).toBe(true)
  })

  it('returns true when existing file contains the marker (still generator-owned)', () => {
    const existing = `# Alcoholics Anonymous\n\n${COVER_MARKER}\n`
    expect(shouldRegenerateCover(existing)).toBe(true)
  })

  it('returns false when existing file lacks the marker (hand-edited)', () => {
    const existing = '# Custom title\n\nHand-edited by PO.\n'
    expect(shouldRegenerateCover(existing)).toBe(false)
  })
})

describe('renderIndex', () => {
  const manifest: Manifest = {
    version: '1.1',
    generatedAt: '2026-04-19T00:00:00Z',
    sections: [
      {
        canonicalSlug: 'fw1',
        group: 'front-matter',
        title: { en: 'Foreword 1', et: 'Eessõna 1' },
        paraIds: [],
        pdfPageStart: 4,
        pdfPageEnd: 4,
      },
      {
        canonicalSlug: 'ch01',
        group: 'chapters',
        title: { en: "Bill's Story", et: 'Billi lugu' },
        paraIds: [],
        pdfPageStart: 22,
        pdfPageEnd: 37,
      },
      {
        canonicalSlug: 's01',
        group: 'stories',
        title: { en: "Dr. Bob's Nightmare", et: 'Doktor Bobi painajalik unenägu' },
        paraIds: [],
        pdfPageStart: 186,
        pdfPageEnd: 196,
      },
      {
        canonicalSlug: 'a-i',
        group: 'appendices',
        title: { en: 'I — The A.A. Tradition', et: 'I — AA Traditsioon' },
        paraIds: [],
        pdfPageStart: 566,
        pdfPageEnd: 571,
      },
    ],
  }

  it('groups sections by group and renders section titles in the target language', () => {
    const outEn = renderIndex(manifest, 'en')
    expect(outEn).toContain('Foreword 1')
    expect(outEn).toContain("Bill's Story")
    expect(outEn).toContain("Dr. Bob's Nightmare")
    expect(outEn).toContain('The A.A. Tradition')
  })

  it('renders ET index with Estonian titles', () => {
    const outEt = renderIndex(manifest, 'et')
    expect(outEt).toContain('Eessõna 1')
    expect(outEt).toContain('Billi lugu')
    expect(outEt).toContain('Doktor Bobi painajalik unenägu')
  })

  it('includes a heading for each group present in the manifest', () => {
    const outEn = renderIndex(manifest, 'en')
    expect((outEn.match(/^## /gm) ?? []).length).toBeGreaterThanOrEqual(3)
  })
})
