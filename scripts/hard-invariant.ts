#!/usr/bin/env node
/**
 * hard-invariant pre-commit hook.
 *
 * Receives the list of staged files as argv. For each chapter whose
 * EN or ET side is staged, loads both sides and runs validatePair().
 * Fails the commit if any pair violates the Hard Invariant.
 *
 * Exit 0 = allow commit, exit 1 = block.
 */

import { promises as fs } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { parse } from '../src/lib/content/parse'
import { validatePair } from '../src/lib/content/validate'

const SCRIPT_FILE = fileURLToPath(import.meta.url)
const REPO_ROOT = resolve(dirname(SCRIPT_FILE), '..')

type ReadFile = (path: string) => Promise<string>
type Result = { ok: true } | { ok: false; violations: string[] }

/**
 * Core logic, extracted for testability. `readFile` defaults to
 * fs.readFile rooted at the repo; tests inject a fake.
 */
export async function checkStagedContent(
  stagedFiles: string[],
  readFile?: ReadFile,
): Promise<Result> {
  const read: ReadFile = readFile ?? ((path) => fs.readFile(join(REPO_ROOT, path), 'utf8'))

  const touchedChapters = new Set<string>()
  for (const file of stagedFiles) {
    const match = file.match(/^src\/content\/(?:en|et)\/(.+)\.md$/)
    if (match === null) continue
    const [, slug] = match
    if (slug === undefined) continue
    touchedChapters.add(slug)
  }

  if (touchedChapters.size === 0) {
    return { ok: true }
  }

  const violations: string[] = []
  for (const slug of touchedChapters) {
    try {
      const enContent = await read(`src/content/en/${slug}.md`)
      const etContent = await read(`src/content/et/${slug}.md`)
      const en = parse(enContent)
      const et = parse(etContent)
      const result = validatePair(en, et)
      if (!result.ok) {
        violations.push(slug)
        console.error(`hard-invariant: violation in chapter '${slug}':`)
        for (const err of result.errors) {
          console.error(`  - [${err.category}] ${err.paraId}: ${err.message}`)
        }
      }
    } catch (err: unknown) {
      violations.push(slug)
      const message = err instanceof Error ? err.message : String(err)
      console.error(`hard-invariant: error reading/parsing '${slug}': ${message}`)
    }
  }

  return violations.length === 0 ? { ok: true } : { ok: false, violations }
}

async function main(stagedFiles: string[]): Promise<void> {
  const result = await checkStagedContent(stagedFiles)
  process.exit(result.ok ? 0 : 1)
}

// pathToFileURL handles Windows (file:///C:/...) vs POSIX (file:///home/...)
// — see scripts/bootstrap-mock-content.ts for the same pattern.
const invokedPath = process.argv[1]
if (invokedPath !== undefined && import.meta.url === pathToFileURL(invokedPath).href) {
  main(process.argv.slice(2)).catch((err: unknown) => {
    const message = err instanceof Error ? err.message : String(err)
    console.error(`hard-invariant: ${message}`)
    process.exit(1)
  })
}
