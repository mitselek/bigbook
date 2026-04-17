import { describe, it, expect } from 'vitest'
import { serialize } from '../../../src/lib/content/serialize'
import { replaceParaText } from '../../../src/lib/content/serialize'
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

describe('replaceParaText', () => {
  const chapter = [
    '---',
    'chapter: ch01-test',
    'title: # Test',
    'lang: et',
    '---',
    '',
    '::para[ch01-test-title]',
    '',
    '# Test',
    '',
    '::para[ch01-test-p001]',
    'Original text.',
    '',
    '::para[ch01-test-p002]',
    'Second paragraph.',
    '',
  ].join('\n')

  it('replaces text for a specific para-id', () => {
    const result = replaceParaText(chapter, 'ch01-test-p001', 'Replacement text.')
    const parsed = parse(result)
    expect(parsed.paragraphs.get('ch01-test-p001')).toBe('Replacement text.')
    expect(parsed.paragraphs.get('ch01-test-p002')).toBe('Second paragraph.')
  })

  it('throws on unknown para-id', () => {
    expect(() => replaceParaText(chapter, 'ch01-test-p999', 'nope')).toThrow(
      "para-id 'ch01-test-p999' not found",
    )
  })

  it('preserves all other paragraphs unchanged', () => {
    const result = replaceParaText(chapter, 'ch01-test-p001', 'Changed.')
    const parsed = parse(result)
    expect(parsed.paragraphs.get('ch01-test-title')).toBe('# Test')
    expect(parsed.paragraphs.get('ch01-test-p002')).toBe('Second paragraph.')
    expect([...parsed.paragraphs.keys()]).toEqual([
      'ch01-test-title',
      'ch01-test-p001',
      'ch01-test-p002',
    ])
  })
})
