import type { ParsedChapter } from './parse'

export type ValidationErrorCategory = 'missing_pair' | 'extra_pair' | 'parse_error'

export type ValidationError = {
  category: ValidationErrorCategory
  paraId: string
  message: string
}

export type ValidationResult = { ok: true } | { ok: false; errors: ValidationError[] }

export function validatePair(en: ParsedChapter, et: ParsedChapter): ValidationResult {
  const errors: ValidationError[] = []
  const enIds = new Set(en.paragraphs.keys())
  const etIds = new Set(et.paragraphs.keys())

  for (const id of enIds) {
    if (!etIds.has(id)) {
      errors.push({
        category: 'missing_pair',
        paraId: id,
        message: `EN has para-id '${id}' but ET does not`,
      })
    }
  }
  for (const id of etIds) {
    if (!enIds.has(id)) {
      errors.push({
        category: 'extra_pair',
        paraId: id,
        message: `ET has para-id '${id}' but EN does not`,
      })
    }
  }

  return errors.length === 0 ? { ok: true } : { ok: false, errors }
}

export function validateProposedContent(
  proposedContent: string,
  referenceParaIds?: Set<string>,
): ValidationResult {
  void proposedContent
  void referenceParaIds
  throw new Error('not implemented')
}
