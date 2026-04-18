import { replaceParaText } from '../content/serialize'
import { validateProposedContent } from '../content/validate'
import type { ValidationResult } from '../content/validate'

export interface PreflightParams {
  currentEt: string
  paraId: string
  newText: string
  referenceParaIds?: Set<string>
}

/**
 * Layer-C pre-flight gate for the inline editor.
 *
 * Builds the proposed full-chapter content from the current ET source and the
 * incoming edit, then validates it against the reference para-id set.  Returns
 * a ValidationResult so callers can branch on ok/!ok without knowing about the
 * internals of validate.ts.
 *
 * Pure function — no side effects, easily unit-testable.
 */
export function preflight({
  currentEt,
  paraId,
  newText,
  referenceParaIds,
}: PreflightParams): ValidationResult {
  const proposed = replaceParaText(currentEt, paraId, newText)
  return validateProposedContent(proposed, referenceParaIds)
}
