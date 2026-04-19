import { describe, expect, it } from 'vitest'
import { classify, lengthRatio } from '../../../scripts/pair-en-et/confidence'

describe('lengthRatio', () => {
  it('computes et/en ratio', () => {
    expect(lengthRatio('aaaaa', 'bbbb')).toBeCloseTo(0.8, 5)
    expect(lengthRatio('a', 'bbb')).toBeCloseTo(3.0, 5)
  })

  it('returns Infinity when EN is empty and ET is non-empty', () => {
    expect(lengthRatio('', 'anything')).toBe(Infinity)
  })

  it('returns NaN when both are empty', () => {
    expect(Number.isNaN(lengthRatio('', ''))).toBe(true)
  })
})

describe('classify', () => {
  it('returns high for in-band ratios', () => {
    expect(classify('hello world', 'tere maailm')).toEqual({ confidence: 'high' })
  })

  it('returns high at lower band edge (0.55)', () => {
    const en = 'x'.repeat(100)
    const et = 'y'.repeat(55)
    expect(classify(en, et)).toEqual({ confidence: 'high' })
  })

  it('returns high at upper band edge (1.6)', () => {
    const en = 'x'.repeat(100)
    const et = 'y'.repeat(160)
    expect(classify(en, et)).toEqual({ confidence: 'high' })
  })

  it('returns low with note when below band', () => {
    const en = 'x'.repeat(100)
    const et = 'y'.repeat(30)
    const result = classify(en, et)
    expect(result.confidence).toBe('low')
    expect(result.notes).toMatch(/^length-ratio 0\.30/)
  })

  it('returns low with note when above band', () => {
    const en = 'x'.repeat(100)
    const et = 'y'.repeat(200)
    const result = classify(en, et)
    expect(result.confidence).toBe('low')
    expect(result.notes).toMatch(/^length-ratio 2\.00/)
  })

  it('returns low with note when both are empty', () => {
    const result = classify('', '')
    expect(result.confidence).toBe('low')
    expect(result.notes).toMatch(/empty/)
  })

  it('returns low with note when only EN is empty', () => {
    const result = classify('', 'anything')
    expect(result.confidence).toBe('low')
    expect(result.notes).toMatch(/empty/)
  })
})
