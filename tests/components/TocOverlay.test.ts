import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/svelte'
import TocOverlay from '../../src/components/TocOverlay.svelte'
import { CHAPTERS } from '../../src/lib/content/manifest'

describe('TocOverlay', () => {
  const defaultProps = {
    chapters: CHAPTERS,
    isOpen: true,
    onSelect: () => {},
    onClose: () => {},
  }

  it('renders three group headings', () => {
    render(TocOverlay, { props: defaultProps })

    expect(screen.getByText('Front matter')).toBeInTheDocument()
    expect(screen.getByText('Chapters')).toBeInTheDocument()
    expect(screen.getByText('Appendices')).toBeInTheDocument()
  })

  it('renders bilingual titles for each chapter', () => {
    render(TocOverlay, { props: defaultProps })

    // Ch01 should have both EN and ET titles (with # prefix stripped)
    expect(screen.getByText(/Bill's Story/)).toBeInTheDocument()
    expect(screen.getByText(/Billi lugu/)).toBeInTheDocument()
  })

  it('does not render when isOpen is false', () => {
    render(TocOverlay, { props: { ...defaultProps, isOpen: false } })

    expect(screen.queryByText('Front matter')).not.toBeInTheDocument()
  })
})
