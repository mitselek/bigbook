import type { Group, Manifest } from './types'

export const COVER_MARKER = '<!-- bootstrap-content:cover-generated -->'

const COVER_EN = `---
chapter: cover
title: "Alcoholics Anonymous"
lang: en
group: reader-chrome
---

# Alcoholics Anonymous

### The Story of How Many Thousands of Men and Women Have Recovered from Alcoholism

Fourth Edition

${COVER_MARKER}
`

const COVER_ET = `---
chapter: cover
title: "Anonüümsed Alkohoolikud"
lang: et
group: reader-chrome
---

# Anonüümsed Alkohoolikud

### Lugu sellest, kuidas mitu tuhat meest ja naist on alkoholismist vabanenud

Neljas väljaanne

${COVER_MARKER}
`

export function renderCover(lang: 'en' | 'et'): string {
  return lang === 'en' ? COVER_EN : COVER_ET
}

export function shouldRegenerateCover(existingContent: string | null): boolean {
  if (existingContent === null) return true
  return existingContent.includes(COVER_MARKER)
}

const GROUP_LABELS: Record<Group, { en: string; et: string }> = {
  'reader-chrome': { en: 'Cover', et: 'Kaas' },
  'front-matter': { en: 'Front Matter', et: 'Eessõnad' },
  chapters: { en: 'Chapters', et: 'Peatükid' },
  stories: { en: 'Personal Stories', et: 'Isiklikud kogemuslood' },
  appendices: { en: 'Appendices', et: 'Lisad' },
}

const INDEX_GROUP_ORDER: readonly Group[] = ['front-matter', 'chapters', 'stories', 'appendices']

export function renderIndex(manifest: Manifest, lang: 'en' | 'et'): string {
  const header = `---
chapter: index
title: "${lang === 'en' ? 'Contents' : 'Sisukord'}"
lang: ${lang}
group: reader-chrome
---

# ${lang === 'en' ? 'Contents' : 'Sisukord'}

`
  const parts: string[] = [header]
  for (const group of INDEX_GROUP_ORDER) {
    const sections = manifest.sections.filter((s) => s.group === group)
    if (sections.length === 0) continue
    parts.push(`## ${GROUP_LABELS[group][lang]}\n`)
    for (const s of sections) {
      parts.push(`- [${s.title[lang]}](/bigbook/${s.canonicalSlug}/)`)
    }
    parts.push('')
  }
  return parts.join('\n')
}
