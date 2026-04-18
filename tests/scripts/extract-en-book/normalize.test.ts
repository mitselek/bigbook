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
      '   paragraph three here',
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
