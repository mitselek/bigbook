import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/svelte'
import ParagraphRow from '../../src/components/ParagraphRow.svelte'

describe('ParagraphRow', () => {
  const defaultProps = {
    paraId: 'ch01-p001',
    enText: 'War fever ran high.',
    etText: 'Sõjapalavik hõõgus.',
    isTitle: false,
    isDiverged: false,
    chapterSlug: 'ch01-billi-lugu',
  }

  it('renders EN and ET text', () => {
    render(ParagraphRow, { props: defaultProps })

    expect(screen.getByText('War fever ran high.')).toBeInTheDocument()
    expect(screen.getByText('Sõjapalavik hõõgus.')).toBeInTheDocument()
  })

  it('has the para-id as element id for deep-linking', () => {
    const { container } = render(ParagraphRow, { props: defaultProps })

    const row = container.querySelector('#ch01-p001')
    expect(row).not.toBeNull()
  })
})
