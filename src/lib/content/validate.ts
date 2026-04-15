import { parse, ParseError } from './parse'
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
  let parsed: ParsedChapter
  try {
    parsed = parse(proposedContent)
  } catch (err) {
    if (err instanceof ParseError) {
      return {
        ok: false,
        errors: [
          {
            category: 'parse_error',
            paraId: '',
            message: `${err.category}: ${err.message}`,
          },
        ],
      }
    }
    throw err
  }

  if (!referenceParaIds) return { ok: true }

  const errors: ValidationError[] = []
  const actualIds = new Set(parsed.paragraphs.keys())
  for (const id of referenceParaIds) {
    if (!actualIds.has(id)) {
      errors.push({
        category: 'missing_pair',
        paraId: id,
        message: `proposed content is missing para-id '${id}'`,
      })
    }
  }
  for (const id of actualIds) {
    if (!referenceParaIds.has(id)) {
      errors.push({
        category: 'extra_pair',
        paraId: id,
        message: `proposed content has unexpected para-id '${id}'`,
      })
    }
  }
  return errors.length === 0 ? { ok: true } : { ok: false, errors }
}
