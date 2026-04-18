/**
 * Thin wrapper around the `pdftotext` binary (from poppler-utils).
 * Always uses -layout mode for consistent spacing and paragraph breaks.
 */

import { spawnSync } from 'node:child_process'

export function extractPages(pdfPath: string, pageStart: number, pageEnd: number): string {
  const result = spawnSync(
    'pdftotext',
    ['-layout', '-f', String(pageStart), '-l', String(pageEnd), pdfPath, '-'],
    { encoding: 'utf8', maxBuffer: 100 * 1024 * 1024 },
  )
  if (result.status !== 0) {
    throw new Error(
      `pdftotext failed (exit ${String(result.status)}) for ${pdfPath} pages ${String(pageStart)}-${String(pageEnd)}: ${result.stderr}`,
    )
  }
  return result.stdout
}
