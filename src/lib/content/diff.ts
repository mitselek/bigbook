import type { ParsedChapter } from './parse'

export function diffCurrentVsBaseline(
  current: ParsedChapter,
  baseline: ParsedChapter,
): Set<string> {
  void current
  void baseline
  throw new Error('not implemented')
}
