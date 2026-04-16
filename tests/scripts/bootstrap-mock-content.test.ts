import { describe, expect, it } from 'vitest'
import {
  stripJekyllPreamble,
  splitIntoParagraphs,
  assignParaIds,
  formatContentFile,
  translateWithClaude,
} from '../../scripts/bootstrap-mock-content'
import { parse } from '../../src/lib/content/parse'

describe('stripJekyllPreamble()', () => {
  it('removes Jekyll YAML frontmatter', () => {
    const input = `---
layout: default
title: Bill's Story
---

Body text here.
Another line.
`
    expect(stripJekyllPreamble(input)).toBe(`Body text here.\nAnother line.`)
  })

  it('removes {{ liquid }} expressions', () => {
    const input = `Visit {{ site.url }}{{ site.baseurl }}/about.`
    expect(stripJekyllPreamble(input)).toBe(`Visit /about.`)
  })

  it('removes {% liquid %} tags (include, for, etc.)', () => {
    const input = `{% include header.html %}
Chapter body.
{% for item in site.pages %}{{ item.title }}{% endfor %}
`
    expect(stripJekyllPreamble(input)).toBe(`Chapter body.`)
  })

  it('handles files with no frontmatter and no liquid (passthrough)', () => {
    const input = `Just plain text.\nSecond line.`
    expect(stripJekyllPreamble(input)).toBe(`Just plain text.\nSecond line.`)
  })
})

describe('splitIntoParagraphs()', () => {
  it('splits on blank lines and trims', () => {
    const input = `First paragraph.

Second paragraph.

  Third paragraph.

Fourth.`
    expect(splitIntoParagraphs(input)).toEqual([
      'First paragraph.',
      'Second paragraph.',
      'Third paragraph.',
      'Fourth.',
    ])
  })

  it('drops empty chunks from consecutive blank lines', () => {
    const input = `First.



Second.`
    expect(splitIntoParagraphs(input)).toEqual(['First.', 'Second.'])
  })

  it('preserves internal line breaks inside a single paragraph', () => {
    const input = `Line one
line two.

Next paragraph.`
    expect(splitIntoParagraphs(input)).toEqual(['Line one\nline two.', 'Next paragraph.'])
  })
})

describe('assignParaIds()', () => {
  it('assigns <slug>-title to the first paragraph when titleAtTop is true', () => {
    const result = assignParaIds(['Kuidas see toimib', 'Body.', 'More body.'], 'ch05', true)
    expect(result).toEqual([
      { id: 'ch05-title', text: 'Kuidas see toimib' },
      { id: 'ch05-p001', text: 'Body.' },
      { id: 'ch05-p002', text: 'More body.' },
    ])
  })

  it('uses p001 onwards when titleAtTop is false', () => {
    const result = assignParaIds(['Body.', 'More body.'], 'bili', false)
    expect(result).toEqual([
      { id: 'bili-p001', text: 'Body.' },
      { id: 'bili-p002', text: 'More body.' },
    ])
  })

  it('pads ordinals to three digits', () => {
    const result = assignParaIds(Array(12).fill('p'), 'ch05', false)
    expect(result[0]?.id).toBe('ch05-p001')
    expect(result[11]?.id).toBe('ch05-p012')
  })
})

describe('formatContentFile()', () => {
  it('produces a file that parse() can round-trip', () => {
    const paragraphs = [
      { id: 'ch05-title', text: 'Kuidas see toimib' },
      { id: 'ch05-p001', text: 'Oleme harva näinud inimest.' },
      { id: 'ch05-p002', text: 'Meie lood\navaldavad üldjoontes.' },
    ]
    const output = formatContentFile(
      { chapter: 'ch05', title: 'Kuidas see toimib', lang: 'et' },
      paragraphs,
    )
    expect(output).toBe(`---
chapter: ch05
title: Kuidas see toimib
lang: et
---

::para[ch05-title]
Kuidas see toimib

::para[ch05-p001]
Oleme harva näinud inimest.

::para[ch05-p002]
Meie lood
avaldavad üldjoontes.
`)
  })
})

describe('formatContentFile() + parse() round-trip', () => {
  it('formatContentFile output parses back to the same para-id map', () => {
    const paragraphs = [
      { id: 'ch05-title', text: 'Kuidas see toimib' },
      { id: 'ch05-p001', text: 'Oleme harva näinud inimest.' },
    ]
    const content = formatContentFile(
      { chapter: 'ch05', title: 'Kuidas see toimib', lang: 'et' },
      paragraphs,
    )
    const parsed = parse(content)
    expect(parsed.frontmatter.chapter).toBe('ch05')
    expect(parsed.frontmatter.lang).toBe('et')
    expect(parsed.paragraphs.get('ch05-title')).toBe('Kuidas see toimib')
    expect(parsed.paragraphs.get('ch05-p001')).toBe('Oleme harva näinud inimest.')
  })
})

describe('translateWithClaude()', () => {
  it('calls the client with a translation prompt and returns the response text', async () => {
    const calls: string[] = []
    const fakeClient = {
      complete: async (prompt: string) => {
        calls.push(prompt)
        return 'Rarely have we seen a person fail.'
      },
    }
    const result = await translateWithClaude('Oleme harva näinud inimest.', fakeClient)
    expect(result).toBe('Rarely have we seen a person fail.')
    expect(calls).toHaveLength(1)
    expect(calls[0]).toContain('Estonian')
    expect(calls[0]).toContain('English')
    expect(calls[0]).toContain('Oleme harva näinud inimest.')
  })

  it('trims whitespace from the client response', async () => {
    const fakeClient = {
      complete: async () => '  Trimmed.  \n',
    }
    const result = await translateWithClaude('Input.', fakeClient)
    expect(result).toBe('Trimmed.')
  })
})
