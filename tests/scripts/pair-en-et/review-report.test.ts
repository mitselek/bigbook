import { describe, expect, it } from 'vitest'
import { renderReviewReport } from '../../../scripts/pair-en-et/review-report'
import type { Extraction, PairingArtifact } from '../../../scripts/pair-en-et/types'

function mkExtraction(overrides: Partial<Extraction> = {}): Extraction {
  return {
    edition: '4th',
    sourcePdf: 'fixture.pdf',
    extractedAt: '2026-04-19T00:00:00Z',
    sections: [
      {
        id: 'ch01-bills-story',
        kind: 'chapter',
        title: "Bill's Story",
        pdfPageStart: 1,
        pdfPageEnd: 1,
        bookPageStart: 1,
        bookPageEnd: 1,
        blocks: [
          { id: 'ch01-bills-story-p001', kind: 'paragraph', text: 'Hello world', pdfPage: 1 },
        ],
      },
    ],
    ...overrides,
  }
}

describe('renderReviewReport', () => {
  it('omits all-high sections and reports zero sections need review', () => {
    const artifact: PairingArtifact = {
      version: '1.0',
      generatedAt: '2026-04-19T00:00:00Z',
      sourceEn: { path: 'en.json', sha256: 'aaa', blockCount: 1 },
      sourceEt: { path: 'et.json', sha256: 'bbb', blockCount: 1 },
      sections: [
        {
          canonicalSlug: 'ch01',
          enSectionId: 'ch01-bills-story',
          etSectionId: 'ch01-billi-lugu',
          pairs: [
            {
              paraId: 'ch01-p001',
              kind: 'paragraph',
              enBlockId: 'ch01-bills-story-p001',
              etBlockId: 'ch01-billi-lugu-p001',
              confidence: 'high',
            },
          ],
          unpaired: [],
          diagnostics: [],
        },
      ],
      unpairedSections: [],
    }
    const en = mkExtraction()
    const et = mkExtraction({
      sections: [
        {
          id: 'ch01-billi-lugu',
          kind: 'chapter',
          title: 'Billi lugu',
          pdfPageStart: 1,
          pdfPageEnd: 1,
          bookPageStart: 1,
          bookPageEnd: 1,
          blocks: [
            { id: 'ch01-billi-lugu-p001', kind: 'paragraph', text: 'Tere maailm', pdfPage: 1 },
          ],
        },
      ],
    })
    const md = renderReviewReport(artifact, en, et)
    expect(md).not.toMatch(/## ch01/)
    expect(md).toMatch(/0 sections need review/)
  })

  it('includes a section with a low-confidence pair and shows both texts', () => {
    const artifact: PairingArtifact = {
      version: '1.0',
      generatedAt: '2026-04-19T00:00:00Z',
      sourceEn: { path: 'en.json', sha256: 'aaa', blockCount: 1 },
      sourceEt: { path: 'et.json', sha256: 'bbb', blockCount: 1 },
      sections: [
        {
          canonicalSlug: 'ch01',
          enSectionId: 'ch01-bills-story',
          etSectionId: 'ch01-billi-lugu',
          pairs: [
            {
              paraId: 'ch01-p001',
              kind: 'paragraph',
              enBlockId: 'ch01-bills-story-p001',
              etBlockId: 'ch01-billi-lugu-p001',
              confidence: 'low',
              notes: 'length-ratio 2.10',
            },
          ],
          unpaired: [],
          diagnostics: [],
        },
      ],
      unpairedSections: [],
    }
    const en = mkExtraction()
    const et = mkExtraction({
      sections: [
        {
          id: 'ch01-billi-lugu',
          kind: 'chapter',
          title: 'Billi lugu',
          pdfPageStart: 1,
          pdfPageEnd: 1,
          bookPageStart: 1,
          bookPageEnd: 1,
          blocks: [
            {
              id: 'ch01-billi-lugu-p001',
              kind: 'paragraph',
              text: 'Tere maailm ' + 'x'.repeat(200),
              pdfPage: 1,
            },
          ],
        },
      ],
    })
    const md = renderReviewReport(artifact, en, et)
    expect(md).toMatch(/## ch01/)
    expect(md).toMatch(/low-confidence/)
    expect(md).toMatch(/ch01-p001/)
    expect(md).toMatch(/Hello world/)
    expect(md).toMatch(/Tere maailm/)
    expect(md).toMatch(/length-ratio 2\.10/)
  })

  it('reports unpaired blocks in a section', () => {
    const artifact: PairingArtifact = {
      version: '1.0',
      generatedAt: '2026-04-19T00:00:00Z',
      sourceEn: { path: 'en.json', sha256: 'aaa', blockCount: 1 },
      sourceEt: { path: 'et.json', sha256: 'bbb', blockCount: 1 },
      sections: [
        {
          canonicalSlug: 'ch01',
          enSectionId: 'ch01-bills-story',
          etSectionId: 'ch01-billi-lugu',
          pairs: [],
          unpaired: [
            {
              blockId: 'ch01-bills-story-p001',
              side: 'en',
              kind: 'paragraph',
              reason: 'needs-review',
            },
          ],
          diagnostics: ['kind-count mismatch: paragraph en=1 et=0'],
        },
      ],
      unpairedSections: [],
    }
    const md = renderReviewReport(artifact, mkExtraction(), mkExtraction({ sections: [] }))
    expect(md).toMatch(/## ch01/)
    expect(md).toMatch(/unpaired/i)
    expect(md).toMatch(/kind-count mismatch/)
  })

  it('reports unpaired sections at the top', () => {
    const artifact: PairingArtifact = {
      version: '1.0',
      generatedAt: '2026-04-19T00:00:00Z',
      sourceEn: { path: 'en.json', sha256: 'aaa', blockCount: 49 },
      sourceEt: { path: 'et.json', sha256: 'bbb', blockCount: 0 },
      sections: [],
      unpairedSections: [
        {
          side: 'en',
          sectionId: 'appendix-aa-pamphlets',
          canonicalSlug: 'a-pamphlets',
          reason: 'section-en-only',
          blockCount: 49,
        },
      ],
    }
    const md = renderReviewReport(
      artifact,
      mkExtraction({ sections: [] }),
      mkExtraction({ sections: [] }),
    )
    expect(md).toMatch(/Unpaired sections/)
    expect(md).toMatch(/a-pamphlets/)
    expect(md).toMatch(/49/)
  })

  it('omits sections whose unpaired blocks have all been resolved', () => {
    const artifact: PairingArtifact = {
      version: '1.0',
      generatedAt: '2026-04-19T00:00:00Z',
      sourceEn: { path: 'en.json', sha256: 'aaa', blockCount: 1 },
      sourceEt: { path: 'et.json', sha256: 'bbb', blockCount: 1 },
      sections: [
        {
          canonicalSlug: 'fw1',
          enSectionId: 'foreword-1st-edition',
          etSectionId: 'eessona-1st',
          pairs: [],
          unpaired: [
            {
              blockId: 'eessona-1st-b010',
              side: 'et',
              kind: 'byline',
              reason: 'section-et-only',
              notes: 'resolved',
            },
          ],
          diagnostics: ['kind-count mismatch: byline en=0 et=1'],
        },
      ],
      unpairedSections: [],
    }
    const md = renderReviewReport(
      artifact,
      mkExtraction({ sections: [] }),
      mkExtraction({ sections: [] }),
    )
    expect(md).not.toMatch(/## fw1/)
    expect(md).toMatch(/0 sections need review/)
  })

  it('renders an N:M low-confidence pair with joined texts and an et-side unpaired block', () => {
    const artifact: PairingArtifact = {
      version: '1.0',
      generatedAt: '2026-04-19T00:00:00Z',
      sourceEn: { path: 'en.json', sha256: 'aaa', blockCount: 2 },
      sourceEt: { path: 'et.json', sha256: 'bbb', blockCount: 2 },
      sections: [
        {
          canonicalSlug: 'ch01',
          enSectionId: 'ch01-bills-story',
          etSectionId: 'ch01-billi-lugu',
          pairs: [
            {
              paraId: 'ch01-q001',
              kind: 'blockquote',
              enBlockId: ['ch01-bills-story-q001', 'ch01-bills-story-q002'],
              etBlockId: ['ch01-billi-lugu-q001'],
              confidence: 'low',
              notes: 'accepted-collapse',
            },
          ],
          unpaired: [
            {
              blockId: 'ch01-billi-lugu-p999',
              side: 'et',
              kind: 'paragraph',
              reason: 'needs-review',
            },
          ],
          diagnostics: [],
        },
      ],
      unpairedSections: [],
    }
    const en: Extraction = {
      edition: '4th',
      sourcePdf: 'en.pdf',
      extractedAt: '2026-04-19T00:00:00Z',
      sections: [
        {
          id: 'ch01-bills-story',
          kind: 'chapter',
          title: "Bill's Story",
          pdfPageStart: 1,
          pdfPageEnd: 1,
          bookPageStart: 1,
          bookPageEnd: 1,
          blocks: [
            {
              id: 'ch01-bills-story-q001',
              kind: 'blockquote',
              text: 'First quote',
              pdfPage: 1,
            },
            {
              id: 'ch01-bills-story-q002',
              kind: 'blockquote',
              text: 'Second quote',
              pdfPage: 1,
            },
          ],
        },
      ],
    }
    const et: Extraction = {
      edition: '4th',
      sourcePdf: 'et.pdf',
      extractedAt: '2026-04-19T00:00:00Z',
      sections: [
        {
          id: 'ch01-billi-lugu',
          kind: 'chapter',
          title: 'Billi lugu',
          pdfPageStart: 1,
          pdfPageEnd: 1,
          bookPageStart: 1,
          bookPageEnd: 1,
          blocks: [
            { id: 'ch01-billi-lugu-q001', kind: 'blockquote', text: 'Kogu tsitaat', pdfPage: 1 },
            {
              id: 'ch01-billi-lugu-p999',
              kind: 'paragraph',
              text: 'Orphan ET paragraph',
              pdfPage: 1,
            },
          ],
        },
      ],
    }
    const md = renderReviewReport(artifact, en, et)
    expect(md).toMatch(/First quote \| Second quote/)
    expect(md).toMatch(/Kogu tsitaat/)
    expect(md).toMatch(/ch01-bills-story-q001, ch01-bills-story-q002/)
    expect(md).toMatch(/Orphan ET paragraph/)
    expect(md).toMatch(/accepted-collapse/)
  })
})
