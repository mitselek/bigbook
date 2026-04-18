import { describe, expect, it } from 'vitest'
import { kebabCase } from '../../../scripts/extract-en-book/slug'

describe('kebabCase', () => {
  it('lowercases ASCII words', () => {
    expect(kebabCase('Preface')).toBe('preface')
  })

  it('joins whitespace-separated words with hyphens', () => {
    expect(kebabCase('A Vision For You')).toBe('a-vision-for-you')
  })

  it('strips punctuation except digits and hyphens', () => {
    expect(kebabCase("Bill's Story")).toBe('bills-story')
    expect(kebabCase('Physician, Heal Thyself!')).toBe('physician-heal-thyself')
  })

  it('collapses internal whitespace runs', () => {
    expect(kebabCase('Dr.   Bob\u2019s  Nightmare')).toBe('dr-bobs-nightmare')
  })

  it('strips leading and trailing hyphens', () => {
    expect(kebabCase('- hello -')).toBe('hello')
  })

  it('preserves digits', () => {
    expect(kebabCase('A.A. Number Three')).toBe('aa-number-three')
  })
})
