import { parse, ParseError } from './parse'
import type { ParsedChapter } from './parse'

export type ValidationErrorCategory = 'missing_pair' | 'extra_pair' | 'parse_error'

export type ValidationError = {
  category: ValidationErrorCategory
  paraId: string
  message: string
}

export type ValidationResult = { ok: true } | { ok: false; errors: ValidationError[] }

function collectMissing(
  from: Set<string>,
  other: Set<string>,
  category: ValidationErrorCategory,
  messageFor: (id: string) => string,
): ValidationError[] {
  const errors: ValidationError[] = []
  for (const id of from) {
    if (!other.has(id)) {
      errors.push({ category, paraId: id, message: messageFor(id) })
    }
  }
  return errors
}

function toResult(errors: ValidationError[]): ValidationResult {
  return errors.length === 0 ? { ok: true } : { ok: false, errors }
}

export function validatePair(en: ParsedChapter, et: ParsedChapter): ValidationResult {
  const enIds = new Set(en.paragraphs.keys())
  const etIds = new Set(et.paragraphs.keys())
  return toResult([
    ...collectMissing(
      enIds,
      etIds,
      'missing_pair',
      (id) => `EN has para-id '${id}' but ET does not`,
    ),
    ...collectMissing(etIds, enIds, 'extra_pair', (id) => `ET has para-id '${id}' but EN does not`),
  ])
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

  const actualIds = new Set(parsed.paragraphs.keys())
  return toResult([
    ...collectMissing(
      referenceParaIds,
      actualIds,
      'missing_pair',
      (id) => `proposed content is missing para-id '${id}'`,
    ),
    ...collectMissing(
      actualIds,
      referenceParaIds,
      'extra_pair',
      (id) => `proposed content has unexpected para-id '${id}'`,
    ),
  ])
}
