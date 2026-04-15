import type { ParsedChapter } from './parse'

export type ValidationErrorCategory = 'missing_pair' | 'extra_pair' | 'parse_error'

export type ValidationError = {
  category: ValidationErrorCategory
  paraId: string
  message: string
}

export type ValidationResult = { ok: true } | { ok: false; errors: ValidationError[] }

export function validatePair(en: ParsedChapter, et: ParsedChapter): ValidationResult {
  void en
  void et
  throw new Error('not implemented')
}
