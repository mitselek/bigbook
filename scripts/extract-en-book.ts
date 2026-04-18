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

import { spawnSync } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { validateExtraction } from './extract-en-book/invariants'
import { fetchOutline } from './extract-en-book/outline'
import { extractPages } from './extract-en-book/pdftotext'
import { buildBookSection } from './extract-en-book/pipeline'
import type { BigBookEnglish, BookSection } from './extract-en-book/types'

const SCRIPT_FILE = fileURLToPath(import.meta.url)
const REPO_ROOT = resolve(dirname(SCRIPT_FILE), '..')
const PDF_PATH = 'legacy/assets/AA-BigBook-4th-Edition.pdf'
const OUT_DIR = 'data/extractions'
const JSON_OUT = `${OUT_DIR}/en-4th-edition.json`
const RAW_OUT = `${OUT_DIR}/en-4th-edition.raw.txt`
const PDF_TOTAL_PAGES = 581

function readMutoolOutline(): string {
  const result = spawnSync('mutool', ['show', PDF_PATH, 'outline'], {
    encoding: 'utf8',
    cwd: REPO_ROOT,
  })
  if (result.status !== 0) {
    throw new Error(
      `mutool failed (exit ${String(result.status)}) for ${PDF_PATH}: ${result.stderr}`,
    )
  }
  return result.stdout
}

async function main(): Promise<void> {
  const nodes = fetchOutline(readMutoolOutline)
  console.log(`outline: ${String(nodes.length)} leaf sections`)

  const pageEnds: number[] = nodes.map((_, i) => {
    const next = nodes[i + 1]
    return next !== undefined ? next.pdfPageStart - 1 : PDF_TOTAL_PAGES
  })

  let chapterCount = 0
  const sections: BookSection[] = []
  for (const [i, node] of nodes.entries()) {
    const chapterOrdinal = node.kind === 'chapter' ? ++chapterCount : 0
    const pdfPageEnd = pageEnds[i] ?? PDF_TOTAL_PAGES
    const section = buildBookSection({
      node,
      chapterOrdinal,
      pdfPath: resolve(REPO_ROOT, PDF_PATH),
      pdfPageEnd,
      bookPageStart: node.pdfPageStart,
      bookPageEnd: pdfPageEnd,
    })
    sections.push(section)
    console.log(`${section.id}: ${String(section.blocks.length)} blocks`)
  }

  const doc: BigBookEnglish = {
    edition: '4th',
    sourcePdf: PDF_PATH,
    extractedAt: process.env.EXTRACTED_AT ?? new Date().toISOString(),
    sections,
  }

  validateExtraction(doc)

  const rawFullBook = extractPages(resolve(REPO_ROOT, PDF_PATH), 1, PDF_TOTAL_PAGES)

  mkdirSync(resolve(REPO_ROOT, OUT_DIR), { recursive: true })
  writeFileSync(resolve(REPO_ROOT, JSON_OUT), JSON.stringify(doc, null, 2) + '\n', 'utf8')
  writeFileSync(resolve(REPO_ROOT, RAW_OUT), rawFullBook, 'utf8')

  console.log(`wrote ${JSON_OUT} (${String(sections.length)} sections)`)
}

main().catch((err: unknown) => {
  console.error(err)
  process.exit(1)
})
