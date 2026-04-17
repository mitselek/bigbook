import { describe, it, expect } from 'vitest'
import { serialize } from '../../../src/lib/content/serialize'
import { parse } from '../../../src/lib/content/parse'

describe('serialize', () => {
  it('round-trips a chapter with frontmatter and paragraphs', () => {
    const input = [
      '---',
      'chapter: ch01-test',
      'title: # Chapter 1: Test',
      'lang: et',
      '---',
      '',
      '::para[ch01-test-title]',
      '',
      '# Chapter 1: Test',
      '',
      '::para[ch01-test-p001]',
      'First paragraph text.',
      '',
      '::para[ch01-test-p002]',
      'Second paragraph text.',
      '',
    ].join('\n')

    const parsed = parse(input)
    const output = serialize(parsed)
    const reparsed = parse(output)

    expect(reparsed.frontmatter).toEqual(parsed.frontmatter)
    expect([...reparsed.paragraphs.entries()]).toEqual([...parsed.paragraphs.entries()])
  })

  it('preserves multi-line paragraph content', () => {
    const input = [
      '---',
      'chapter: ch01-test',
      'title: # Test',
      'lang: en',
      '---',
      '',
      '::para[ch01-test-title]',
      '',
      '# Test',
      '',
      '::para[ch01-test-p001]',
      '> "Here lies a Hampshire Grenadier,',
      '> who caught his death',
      '> drinking cold small beer."',
      '',
    ].join('\n')

    const parsed = parse(input)
    const output = serialize(parsed)
    const reparsed = parse(output)

    expect(reparsed.paragraphs.get('ch01-test-p001')).toBe(parsed.paragraphs.get('ch01-test-p001'))
  })
})
