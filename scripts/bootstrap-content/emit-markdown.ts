import type { RenderedBlock } from './types'

const BODERIE_ATTRIBUTION = '(_BB:Boderie_)'

export function renderBlock(block: RenderedBlock): string {
  const header = `::para[${block.paraId}]`
  const body = renderBody(block)
  const attribution = block.isAutoTranslated ? `\n\n${BODERIE_ATTRIBUTION}` : ''
  return `${header}\n\n${body}${attribution}\n`
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
