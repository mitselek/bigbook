import { describe, expect, it } from 'vitest'
import { checkStagedContent } from '../../scripts/hard-invariant'

describe('hard-invariant checkStagedContent()', () => {
  it('returns ok when staged files list is empty', async () => {
    const result = await checkStagedContent([], async () => '')
    expect(result.ok).toBe(true)
  })

  it('returns ok when only unrelated files are staged', async () => {
    const result = await checkStagedContent(
      ['src/lib/auth/config.ts', 'docs/readme.md'],
      async () => '',
    )
    expect(result.ok).toBe(true)
  })

  it('validates a pair of files under src/content/ via the reader', async () => {
    const valid = async (path: string) => {
      if (path === 'src/content/en/ch05.md') {
        return `---
chapter: ch05
title: How It Works
lang: en
---

::para[ch05-title]
How It Works

::para[ch05-p001]
Rarely have we seen a person fail.
`
      }
      return `---
chapter: ch05
title: Kuidas see toimib
lang: et
---

::para[ch05-title]
Kuidas see toimib

::para[ch05-p001]
Oleme harva näinud inimest.
`
    }
    const result = await checkStagedContent(
      ['src/content/en/ch05.md', 'src/content/et/ch05.md'],
      valid,
    )
    expect(result.ok).toBe(true)
  })

  it('reports a Hard Invariant violation', async () => {
    const invalid = async (path: string) => {
      if (path === 'src/content/en/ch05.md') {
        return `---
chapter: ch05
title: How It Works
lang: en
---

::para[ch05-title]
How It Works

::para[ch05-p001]
Rarely have we seen a person fail.

::para[ch05-p002]
Our stories disclose.
`
      }
      return `---
chapter: ch05
title: Kuidas see toimib
lang: et
---

::para[ch05-title]
Kuidas see toimib

::para[ch05-p001]
Oleme harva näinud inimest.
`
    }
    const result = await checkStagedContent(
      ['src/content/en/ch05.md', 'src/content/et/ch05.md'],
      invalid,
    )
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.violations).toContain('ch05')
  })
})
