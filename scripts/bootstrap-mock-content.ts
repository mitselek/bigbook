#!/usr/bin/env node
/**
 * One-shot bootstrap script for bigbook v1 mock content.
 *
 * Reads legacy Jekyll markdown under legacy/peatykid/, legacy/kogemuslood/,
 * legacy/lisad/, legacy/front_matter/; strips Jekyll preamble and liquid;
 * assigns para-ids; writes src/content/et/<slug>.md; calls the Claude API
 * for each paragraph's translation; writes src/content/en/<slug>.md;
 * validates each pair against the Hard Invariant; emits
 * src/lib/content/manifest.ts.
 *
 * Run: CONTENT_BOOTSTRAP=1 npm run bootstrap:content
 *
 * Requires: CLAUDE_API_KEY env var, CONTENT_BOOTSTRAP=1 env var.
 *
 * This script is NOT part of the Astro build. It is run manually by
 * Plantin, once per content generation, and the output is then committed
 * in two commits (content + baseline-config) per Phase 6.
 */

import { pathToFileURL } from 'node:url'

/**
 * Strip Jekyll-style preamble from a legacy markdown file:
 * - Remove the leading YAML frontmatter block (between `---` fences).
 * - Remove liquid expressions like `{{ site.url }}`.
 * - Remove liquid tags like `{% include ... %}` or `{% for %}...{% endfor %}`.
 * Returns the body with surrounding whitespace trimmed.
 *
 * The frontmatter strip uses string slicing (indexOf) rather than a regex
 * capture group, which dodges the session-5 LESSON #1 trap: regex captures
 * typed as `string | undefined` under `noUncheckedIndexedAccess` force
 * defensive branches that v8 coverage flags as dead.
 */
export function stripJekyllPreamble(content: string): string {
  let body = content

  // Strip a leading YAML frontmatter block if present. `---\n` opens, a
  // later `\n---\n` closes (we search from past the opener).
  if (body.startsWith('---\n')) {
    const endFence = body.indexOf('\n---\n', 4)
    if (endFence !== -1) {
      body = body.slice(endFence + 5)
    }
  }

  // Strip {% ... %} tags including block tags with matching {% endfoo %}.
  // Block removal first (greedy match between opener and its matching endtag).
  body = body.replace(/\{%\s*(\w+)[\s\S]*?\{%\s*end\1\s*%\}/g, '')
  // Then strip any remaining standalone {% ... %} tags (include, assign, etc.).
  body = body.replace(/\{%[\s\S]*?%\}/g, '')
  // Then strip {{ ... }} expressions.
  body = body.replace(/\{\{[\s\S]*?\}\}/g, '')

  return body.trim()
}

export interface IdentifiedParagraph {
  id: string
  text: string
}

export function splitIntoParagraphs(_stripped: string): string[] {
  throw new Error('not implemented')
}

export function assignParaIds(
  _paragraphs: string[],
  _chapterSlug: string,
  _titleAtTop: boolean,
): IdentifiedParagraph[] {
  throw new Error('not implemented')
}

export function main(_argv: string[]): void {
  if (process.env['CONTENT_BOOTSTRAP'] !== '1') {
    console.error('error: CONTENT_BOOTSTRAP=1 must be set in the environment')
    process.exit(1)
  }
  if (process.env['CLAUDE_API_KEY'] === undefined || process.env['CLAUDE_API_KEY'] === '') {
    console.error('error: CLAUDE_API_KEY must be set in the environment')
    process.exit(1)
  }
  console.log('bootstrap: not yet implemented — see P4.2 onward')
}

// Only run main() when this file is executed directly, not when imported.
// pathToFileURL handles Windows (file:///C:/...) vs POSIX (file:///home/...)
// differences that a manual `file://` concat gets wrong on Windows.
const invokedPath = process.argv[1]
if (invokedPath !== undefined && import.meta.url === pathToFileURL(invokedPath).href) {
  main(process.argv.slice(2))
}
