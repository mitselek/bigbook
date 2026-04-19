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

function renderBody(block: RenderedBlock): string {
  switch (block.kind) {
    case 'heading':
      return `# ${block.text}`
    case 'paragraph':
      return block.text
    case 'list-item':
      return `- ${block.text}`
    case 'blockquote':
      return block.text
        .split('\n')
        .map((line) => `> ${line}`)
        .join('\n')
    case 'verse':
      return block.text.replace(/\n/g, '  \n')
    case 'table':
      return block.text
    case 'byline':
      return `*${block.text}*`
    case 'footnote':
      return `*${block.text}*`
  }
}
