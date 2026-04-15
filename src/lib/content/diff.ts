import type { ParsedChapter } from './parse'

/**
 * Return the set of `para-id`s whose text differs between current and
 * baseline. Permissive about mismatched id sets — para-ids that exist in
 * only one side are not reported (the validator in validate.ts handles
 * the Hard Invariant at commit time).
 */
export function diffCurrentVsBaseline(
  current: ParsedChapter,
  baseline: ParsedChapter,
): Set<string> {
  const diverged = new Set<string>()
  for (const [id, currentText] of current.paragraphs) {
    const baselineText = baseline.paragraphs.get(id)
    if (baselineText === undefined) continue
    if (currentText !== baselineText) {
      diverged.add(id)
    }
  }
  return diverged
}
