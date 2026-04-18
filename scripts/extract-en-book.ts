#!/usr/bin/env node
/**
 * Extract the AA Big Book 4th edition PDF into a structured JSON artifact.
 *
 * Run: npm run extract:en
 *
 * Output:
 *   data/extractions/en-4th-edition.json
 *   data/extractions/en-4th-edition.raw.txt
 *   data/extractions/sample-review.md
 *
 * See docs/superpowers/specs/2026-04-18-en-book-extraction-design.md
 */

async function main(): Promise<void> {
  throw new Error('not yet implemented')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
