import { describe, expect, it } from 'vitest'
import { normalize } from '../../../scripts/extract-en-book/normalize'

describe('normalize', () => {
  it('strips Adobe QXD running header', () => {
    const input = [
      'Alco_1893007162_6p_01_r5.qxd 4/4/03 11:17 AM Page 154',
      '',
      'real content here',
    ].join('\n')
    const out = normalize(input, { sectionTitle: 'A Vision For You' })
    expect(out).not.toMatch(/\.qxd/)
    expect(out).toContain('real content here')
  })

  it('strips standalone page-number lines', () => {
    const input = ['real content', '', '154', '', 'more content'].join('\n')
    const out = normalize(input, { sectionTitle: 'Any' })
    expect(out).not.toMatch(/^154$/m)
    expect(out).toContain('real content')
    expect(out).toContain('more content')
  })

  it('strips combined page-number + section title line (layout mode artifact)', () => {
    const input = ['              154             ALCOHOLICS ANONYMOUS', 'real content here'].join(
      '\n',
    )
    const out = normalize(input, { sectionTitle: 'A Vision For You' })
    expect(out).not.toMatch(/ALCOHOLICS ANONYMOUS/)
    expect(out).not.toMatch(/154/)
    expect(out).toContain('real content here')
  })
})

describe('normalize — hyphen rejoin', () => {
  it('rejoins a word broken across lines', () => {
    const input = 'suc-\ncessful in his'
    const out = normalize(input, { sectionTitle: 'Any' })
    expect(out).toContain('successful in his')
    expect(out).not.toContain('suc-')
  })

  it('preserves intentional hyphen compounds', () => {
    const input = 'self-reliance and contentment'
    const out = normalize(input, { sectionTitle: 'Any' })
    expect(out).toContain('self-reliance')
  })

  it('rejoins across stripped page-break artifacts', () => {
    const input = [
      'suc-',
      'Alco_1893007162_6p_01_r5.qxd 4/4/03 11:17 AM Page 155',
      '',
      '              155             ALCOHOLICS ANONYMOUS',
      'cessful in his enterprise',
    ].join('\n')
    const out = normalize(input, { sectionTitle: 'A Vision For You' })
    expect(out).toContain('successful in his enterprise')
  })
})

describe('normalize — paragraph rejoin across page breaks', () => {
  it('rejoins a paragraph split by a page-break artifact', () => {
    const input = [
      'First half of paragraph ending',
      'Alco_1893007162_6p_01_r5.qxd 4/4/03 11:17 AM Page 155',
      '',
      '              155             ALCOHOLICS ANONYMOUS',
      'second half continues here.',
    ].join('\n')
    const out = normalize(input, { sectionTitle: 'A Vision For You' })
    const paragraphs = out.split(/\n\s*\n/).filter((p) => p.trim())
    expect(paragraphs).toHaveLength(1)
    expect(paragraphs[0]).toContain('First half of paragraph ending')
    expect(paragraphs[0]).toContain('second half continues here.')
  })

  it('preserves legitimate paragraph breaks', () => {
    const input = ['First paragraph.', '', 'Second paragraph.'].join('\n')
    const out = normalize(input, { sectionTitle: 'Any' })
    const paragraphs = out.split(/\n\s*\n/).filter((p) => p.trim())
    expect(paragraphs).toHaveLength(2)
  })
})

describe('normalize — indent-as-paragraph-break (N1)', () => {
  it('treats a line with leading indent as the start of a new paragraph', () => {
    const input = [
      'paragraph one ends here.',
      '   We begin paragraph two here',
      'with a continuation line.',
      '   Paragraph three here',
    ].join('\n')
    const out = normalize(input, { sectionTitle: 'Any' })
    const paragraphs = out.split(/\n\s*\n/).filter((p) => p.trim().length > 0)
    expect(paragraphs).toHaveLength(3)
  })
})

describe('normalize — drop-cap artifact (N2)', () => {
  it('collapses the whitespace gap between a drop-cap capital and its continuation', () => {
    const input = 'W         ar fever ran high, and the state called me.'
    const out = normalize(input, { sectionTitle: "Bill's Story" })
    expect(out.replace(/\n/g, '')).not.toMatch(/\s{2,}/)
    expect(out).toContain('War fever')
  })
})

describe('normalize — reversed running title (N3)', () => {
  it('strips a title-first-then-page-number running header line', () => {
    const input = [
      '              THERE IS A SOLUTION                 19',
      'tions we have found most effective...',
    ].join('\n')
    const out = normalize(input, { sectionTitle: 'There is a Solution' })
    expect(out).not.toContain('THERE IS A SOLUTION')
    expect(out).not.toMatch(/\b19\b/)
    expect(out).toContain('tions we have found most effective')
  })
})

describe('normalize — preserve section-title heading line (N4)', () => {
  it('keeps the section title when it appears as a standalone heading line', () => {
    const input = [
      'WOMEN SUFFER TOO',
      '',
      '(3) Despite great opportunities, alcohol nearly ended her life.',
    ].join('\n')
    const out = normalize(input, { sectionTitle: 'Women Suffer Too' })
    expect(out).toContain('WOMEN SUFFER TOO')
    expect(out).toContain('(3) Despite great opportunities')
  })
})

describe('normalize — N1 calibration (Task 19)', () => {
  it('N5: splits ch02-style body-margin 10 / paragraph-indent 14', () => {
    const raw = [
      '          held us together as we are now joined.',
      '              The tremendous fact for every one of us is that we',
      '          have discovered a common solution. We have a way',
    ].join('\n')
    const out = normalize(raw, { sectionTitle: 'There is a Solution' })
    const paragraphs = out.split(/\n\s*\n/).filter((p) => p.trim() !== '')
    expect(paragraphs).toHaveLength(2)
    expect(paragraphs[0]).toMatch(/joined\.$/)
    expect(paragraphs[1]).toMatch(/^\s*The tremendous fact/)
  })

  it('N6: drop-cap continuation (lowercase at high indent) stays in paragraph', () => {
    const raw = [
      '           I believe it would be good to tell the story of my',
      '                life. Doing so will give me the opportunity to re-',
      '          member that I must be grateful to God and to those',
    ].join('\n')
    const out = normalize(raw, { sectionTitle: 'Gratitude in Action' })
    const paragraphs = out.split(/\n\s*\n/).filter((p) => p.trim() !== '')
    expect(paragraphs).toHaveLength(1)
  })

  it('N7: mid-sentence continuation at body margin does not split', () => {
    const raw = [
      '          I was powerless over alcohol. I was learning that I',
      '          could do nothing to fight it off,',
      '          even while I was denying the fact.',
      '             On Easter weekend 1944, I found myself in a jail',
    ].join('\n')
    const out = normalize(raw, { sectionTitle: 'Gratitude in Action' })
    const paragraphs = out.split(/\n\s*\n/).filter((p) => p.trim() !== '')
    expect(paragraphs).toHaveLength(2)
    expect(paragraphs[0]).toMatch(/denying the fact\.$/)
    expect(paragraphs[1]).toMatch(/^\s*On Easter weekend 1944/)
  })

  it("N8: regression — Bill's Story body-margin 0 with 3-space paragraph indent still splits", () => {
    const raw = [
      'burg were assigned, and we were flattered when the',
      'first citizens took us to their homes, making us feel',
      'heroic. Here was love, applause, war; moments sublime',
      '   My brother-in-law is a physician, and through his',
    ].join('\n')
    const out = normalize(raw, { sectionTitle: "Bill's Story" })
    const paragraphs = out.split(/\n\s*\n/).filter((p) => p.trim() !== '')
    expect(paragraphs).toHaveLength(2)
    expect(paragraphs[0]).toMatch(/moments sublime$/)
    expect(paragraphs[1]).toMatch(/^\s*My brother-in-law/)
  })
})

describe('normalize — page-boundary cleanup', () => {
  it('strips QXD annotation with form-feed prefix (#36)', () => {
    const raw = [
      'paragraph one ends here.',
      '\fAlco_1893007162_6p_01_r5.qxd 4/4/03 11:17 AM Page 17',
      'paragraph two continues here.',
    ].join('\n')
    const out = normalize(raw, { sectionTitle: 'Any' })
    expect(out).not.toMatch(/Alco_.*\.qxd/)
  })

  it('strips all blank lines around a stripped running header (#37)', () => {
    const raw = [
      '          last line of page 81.',
      '',
      '',
      '',
      '',
      '              INTO ACTION                    81',
      '          first line of page 82 continues.',
    ].join('\n')
    const out = normalize(raw, { sectionTitle: 'Into Action' })
    const paragraphs = out.split(/\n\s*\n/).filter((p) => p.trim() !== '')
    expect(paragraphs).toHaveLength(1)
    expect(paragraphs[0]).toMatch(/last line of page 81[\s\S]*first line of page 82/)
  })
})

describe('normalize — N1 local-delta (Task 22)', () => {
  it('N9: two-body-margin section does not false-fire uppercase body lines', () => {
    // Fixture modeled on Gratitude in Action (pages 208-209 / book pages
    // 193-194). The book's justified layout uses 10-space body margin on
    // odd pages and 14-space body margin on even pages. Paragraph starts
    // on odd pages are at 13 spaces; on even pages at 17 spaces.
    //
    // When the section spans both page types, the older mode-based rule
    // picks one margin (say 10) as `bodyMargin` and sets threshold = 13.
    // Uppercase-starting body lines at 14 then exceed the threshold and
    // false-fire as paragraph starts (observed: "I finally spoke to a
    // woman,", "Bobbie, who said...", "Book in the mail..." all became
    // standalone blocks).
    //
    // The fixture has 7 lines at 10 (odd-page body), 5 lines at 14 (even-
    // page body, including two uppercase-starting lines), and 1 line at
    // 17 (real even-page P-start). Mode = 10, threshold = 13. Under the
    // OLD rule, lines 11 ("I finally...") and 12 ("Bobbie,...") at 14
    // spaces with uppercase starts would fire as false P-starts.
    //
    // Under local-delta, lines 11 and 12 compare to their immediate
    // predecessor (also 14-indent), so 14 < 14+3 → do not fire.
    const raw = [
      '          later I came to understand that A.A.',
      '          members were helping each other every day.',
      '          That message finally reached me.',
      '          I knew it could work for me too.',
      '          I felt hope for the first time.',
      '          Even so, I struggled with doubt.',
      '          Every day was a battle with fear.',
      '              was transformed. Alcohol suddenly made me into',
      '              what I had always wanted to be.',
      '              used it only at parties and meetings.',
      '              I finally spoke to a woman, a kind woman,',
      '              Bobbie, who said words I hope I never forget:',
      '                 Alcohol became my everyday companion.',
    ].join('\n')
    const out = normalize(raw, { sectionTitle: 'Gratitude in Action' })
    const paragraphs = out.split(/\n\s*\n/).filter((p) => p.trim() !== '')
    // Expected: exactly 2 paragraphs under local-delta.
    //   1. Lines 1-12 as one flowing paragraph (no false-fires on
    //      "I finally spoke..." or "Bobbie, who said..." at 14-indent).
    //   2. Line 13 "Alcohol became my everyday companion." (17-indent
    //      P-start).
    expect(paragraphs).toHaveLength(2)
    expect(paragraphs[0]).toMatch(
      /later I came to understand[\s\S]*Bobbie, who said words I hope I never forget:/,
    )
    expect(paragraphs[1]).toMatch(/^\s*Alcohol became my everyday companion\.$/)
  })
})
