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
