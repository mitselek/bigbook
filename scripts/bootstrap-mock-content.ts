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

/**
 * Split a stripped markdown body into paragraphs on blank-line boundaries.
 * Trims each paragraph. Drops empty chunks from consecutive blank lines.
 */
export function splitIntoParagraphs(stripped: string): string[] {
  return stripped
    .split(/\n\s*\n/)
    .map((chunk) => chunk.trim())
    .filter((chunk) => chunk.length > 0)
}

/**
 * Assign para-ids of form `<slug>-title` (if titleAtTop) or `<slug>-p<nnn>`
 * with three-digit zero-padded ordinal. Ordinals start at 001 regardless
 * of whether the first paragraph is a title.
 *
 * Uses `for..of` rather than indexed iteration — under
 * `noUncheckedIndexedAccess`, `paragraphs[i]` is `string | undefined`, but
 * `for..of` yields `string` directly.
 */
export function assignParaIds(
  paragraphs: string[],
  chapterSlug: string,
  titleAtTop: boolean,
): IdentifiedParagraph[] {
  const out: IdentifiedParagraph[] = []
  let ordinal = 1
  let isFirst = true
  for (const text of paragraphs) {
    if (titleAtTop && isFirst) {
      out.push({ id: `${chapterSlug}-title`, text })
    } else {
      const paddedOrdinal = String(ordinal).padStart(3, '0')
      out.push({ id: `${chapterSlug}-p${paddedOrdinal}`, text })
      ordinal++
    }
    isFirst = false
  }
  return out
}

export interface ClaudeClient {
  complete(prompt: string): Promise<string>
}

/**
 * Translate a single Estonian paragraph to English using the Claude API.
 *
 * The `client` parameter is an object with `.complete(prompt): Promise<string>`.
 * A real client is built by `buildRealClaudeClient()` below; tests inject a fake.
 */
export async function translateWithClaude(
  estonianText: string,
  client: ClaudeClient,
): Promise<string> {
  const prompt = `Translate the following Estonian text to English. Preserve the meaning exactly. Return only the translated English text, no commentary, no quotation marks.

Estonian: ${estonianText}

English:`
  const response = await client.complete(prompt)
  return response.trim()
}

/**
 * Build a real Claude client using the Anthropic SDK. Returns an object
 * compatible with translateWithClaude's `client` parameter.
 *
 * The `message.content[0]` access is guarded — under
 * `noUncheckedIndexedAccess` it is `ContentBlock | undefined` and we
 * need an explicit narrowing before reading `.type`/`.text`.
 */
export function buildRealClaudeClient(): ClaudeClient {
  return {
    complete: async (prompt: string): Promise<string> => {
      // Lazy import so tests that don't use the real client don't pay the cost.
      const { default: Anthropic } = await import('@anthropic-ai/sdk')
      const apiKey = process.env['CLAUDE_API_KEY']
      if (apiKey === undefined || apiKey === '') {
        throw new Error('CLAUDE_API_KEY not set in environment')
      }
      const client = new Anthropic({ apiKey })
      const message = await client.messages.create({
        model: 'claude-opus-4-6',
        max_tokens: 4096,
        messages: [{ role: 'user', content: prompt }],
      })
      const block = message.content[0]
      if (block === undefined || block.type !== 'text') {
        throw new Error(`unexpected Claude response: ${block?.type ?? 'empty content array'}`)
      }
      return block.text
    },
  }
}

export interface ContentFrontmatter {
  chapter: string
  title: string
  lang: 'en' | 'et'
}

/**
 * Render a ParsedChapter-shaped input to the ::para[]-directive format
 * that src/lib/content/parse.ts reads. Produces:
 *
 *   ---
 *   chapter: <chapter>
 *   title: <title>
 *   lang: <lang>
 *   ---
 *
 *   ::para[<id1>]
 *   <text1>
 *
 *   ::para[<id2>]
 *   <text2>
 *   ...
 */
export function formatContentFile(
  frontmatter: ContentFrontmatter,
  paragraphs: IdentifiedParagraph[],
): string {
  const lines: string[] = [
    '---',
    `chapter: ${frontmatter.chapter}`,
    `title: ${frontmatter.title}`,
    `lang: ${frontmatter.lang}`,
    '---',
    '',
  ]
  for (const { id, text } of paragraphs) {
    lines.push(`::para[${id}]`)
    lines.push(text)
    lines.push('')
  }
  return lines.join('\n')
}

export interface ManifestChapter {
  slug: string
  title: { en: string; et: string }
  paraIds: string[]
}

/**
 * Emit the contents of src/lib/content/manifest.ts as a TypeScript string.
 * Produces a typed list of chapters with para-ids and bilingual titles.
 * Row height estimates are exported as constants for src/lib/reader to
 * consume when rendering the skeleton.
 */
export function emitManifest(chapters: ManifestChapter[]): string {
  const lines: string[] = [
    '// Generated by scripts/bootstrap-mock-content.ts — do not edit by hand.',
    '// Regenerate with: CONTENT_BOOTSTRAP=1 npm run bootstrap:content',
    '',
    'export type ChapterManifest = {',
    '  slug: string',
    '  title: { en: string; et: string }',
    '  paraIds: readonly string[]',
    '}',
    '',
    'export const ESTIMATED_HEIGHT_TITLE = 60',
    'export const ESTIMATED_HEIGHT_BODY = 110',
    '',
    'export const CHAPTERS: readonly ChapterManifest[] = [',
  ]
  for (const ch of chapters) {
    lines.push('  {')
    lines.push(`    slug: '${ch.slug}',`)
    lines.push(`    title: { en: '${ch.title.en}', et: '${ch.title.et}' },`)
    lines.push('    paraIds: [')
    for (const id of ch.paraIds) {
      lines.push(`      '${id}',`)
    }
    lines.push('    ],')
    lines.push('  },')
  }
  lines.push(']')
  lines.push('')
  return lines.join('\n')
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
