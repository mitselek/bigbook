import type { RenderedBlock, SectionRenderPlan } from './types'

const BODERIE_ATTRIBUTION = '(_BB:Boderie_)'

export function renderBlock(block: RenderedBlock): string {
  const header = `::para[${block.paraId}]`
  const body = renderBody(block)
  const attribution = block.isAutoTranslated ? `\n\n${BODERIE_ATTRIBUTION}` : ''
  return `${header}\n\n${body}${attribution}\n`
}

function escapeYamlString(text: string): string {
  return text.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
}

function frontmatter(plan: SectionRenderPlan, lang: 'en' | 'et'): string {
  const title = escapeYamlString(plan.title[lang])
  return `---
chapter: ${plan.canonicalSlug}
title: "${title}"
lang: ${lang}
group: ${plan.group}
pdfPageStart: ${plan.pdfPageStart}
pdfPageEnd: ${plan.pdfPageEnd}
---
`
}

export function renderSection(plan: SectionRenderPlan, lang: 'en' | 'et'): string {
  const blocks = lang === 'en' ? plan.en : plan.et
  const fm = frontmatter(plan, lang)
  if (blocks.length === 0) return fm
  const body = blocks.map((b) => renderBlock(b)).join('\n')
  return fm + '\n' + body
}

// Markdown treats a line that starts with `<digits>. ` (or tab) as an ordered-list
// marker, so prose like "1940. aastal..." renders as <ol start="1940">. Escape the
// period at start-of-line to prevent that.
function escapeLeadingOrderedListMarker(text: string): string {
  return text.replace(/^(\d+)(\.[ \t])/gm, '$1\\$2')
}

function renderBody(block: RenderedBlock): string {
  switch (block.kind) {
    case 'heading':
      return `# ${block.text}`
    case 'paragraph':
      return escapeLeadingOrderedListMarker(block.text)
    case 'list-item':
      return `- ${block.text}`
    case 'blockquote':
      return escapeLeadingOrderedListMarker(block.text)
        .split('\n')
        .map((line) => `> ${line}`)
        .join('\n')
    case 'verse':
      return escapeLeadingOrderedListMarker(block.text).replace(/\n/g, '  \n')
    case 'table':
      return block.text
    case 'byline':
      return `*${block.text}*`
    case 'footnote':
      return `*${block.text}*`
  }
}
