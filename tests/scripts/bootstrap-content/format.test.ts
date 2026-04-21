import { describe, expect, it, beforeEach, afterEach } from 'vitest'
import { mkdtempSync, writeFileSync, readFileSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { formatFile } from '../../../scripts/bootstrap-content/format'

describe('formatFile', () => {
  let tmp: string

  beforeEach(() => {
    tmp = mkdtempSync(join(tmpdir(), 'bootstrap-format-'))
  })

  afterEach(() => {
    rmSync(tmp, { recursive: true, force: true })
  })

  it('rewrites a markdown file to Prettier-canonical form', async () => {
    const path = join(tmp, 'doc.md')
    // Single quotes in YAML frontmatter are Prettier-non-canonical; should become double.
    const input = `---\ntitle: 'Hello'\nlang: en\n---\n\nBody.\n`
    writeFileSync(path, input, 'utf-8')
    await formatFile(path)
    const after = readFileSync(path, 'utf-8')
    expect(after).toContain('title: "Hello"')
  })

  it('is a no-op when the file is already Prettier-canonical', async () => {
    const path = join(tmp, 'clean.json')
    const canonical = `{\n  "version": "1.1",\n  "value": 1\n}\n`
    writeFileSync(path, canonical, 'utf-8')
    await formatFile(path)
    const after = readFileSync(path, 'utf-8')
    expect(after).toBe(canonical)
  })

  it('runs formatFiles over a list sequentially', async () => {
    const { formatFiles } = await import('../../../scripts/bootstrap-content/format')
    const a = join(tmp, 'a.md')
    const b = join(tmp, 'b.md')
    writeFileSync(a, `---\ntitle: 'A'\n---\n`, 'utf-8')
    writeFileSync(b, `---\ntitle: 'B'\n---\n`, 'utf-8')
    await formatFiles([a, b])
    expect(readFileSync(a, 'utf-8')).toContain('title: "A"')
    expect(readFileSync(b, 'utf-8')).toContain('title: "B"')
  })
})
