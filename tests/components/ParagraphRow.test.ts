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

  it('renders as heading when isTitle is true', () => {
    render(ParagraphRow, {
      props: { ...defaultProps, paraId: 'ch01-title', isTitle: true },
    })

    const headings = screen.getAllByRole('heading', { level: 2 })
    expect(headings.length).toBe(2) // one EN, one ET
  })

  it('renders as paragraph when isTitle is false', () => {
    render(ParagraphRow, { props: defaultProps })

    const headings = screen.queryAllByRole('heading')
    expect(headings.length).toBe(0)
  })

  it('renders marginalia when diverged', () => {
    render(ParagraphRow, {
      props: {
        ...defaultProps,
        isDiverged: true,
        baselineEtText: 'Original Estonian text here.',
      },
    })

    expect(screen.getByText('originaal')).toBeInTheDocument()
    expect(screen.getByText(/Original Estonian text/)).toBeInTheDocument()
  })

  it('does not render marginalia when not diverged', () => {
    render(ParagraphRow, { props: defaultProps })

    expect(screen.queryByText('originaal')).not.toBeInTheDocument()
  })

  it('pairs EN and ET with aria-labelledby', () => {
    const { container } = render(ParagraphRow, { props: defaultProps })

    const row = container.querySelector('#ch01-p001')
    const enId = `${defaultProps.paraId}-en`
    const etId = `${defaultProps.paraId}-et`

    expect(container.querySelector(`#${enId}`)).not.toBeNull()
    expect(container.querySelector(`#${etId}`)).not.toBeNull()
    expect(row?.getAttribute('aria-labelledby')).toBe(`${enId} ${etId}`)
  })

  describe('renderMd sentinel <not-a-list/>', () => {
    it('renders year-start ET sentence as <p>, not <ol>', () => {
      const { container } = render(ParagraphRow, {
        props: {
          ...defaultProps,
          etText: '<not-a-list/>1929. aastal nakatusin golfipalavikku.',
        },
      })

      const etCol = container.querySelector('#ch01-p001-et')
      expect(etCol).not.toBeNull()
      // Must contain a paragraph element
      expect(etCol?.querySelector('p')).not.toBeNull()
      // Must NOT contain an ordered list
      expect(etCol?.querySelector('ol')).toBeNull()
    })

    it('renders year-start EN sentence as <p>, not <ol>', () => {
      const { container } = render(ParagraphRow, {
        props: {
          ...defaultProps,
          enText: '<not-a-list/>1929. I caught golf fever.',
        },
      })

      const enCol = container.querySelector('#ch01-p001-en')
      expect(enCol).not.toBeNull()
      expect(enCol?.querySelector('p')).not.toBeNull()
      expect(enCol?.querySelector('ol')).toBeNull()
    })

    it('does not leak the sentinel literal into the DOM', () => {
      const { container } = render(ParagraphRow, {
        props: {
          ...defaultProps,
          etText: '<not-a-list/>1929. aastal nakatusin golfipalavikku.',
          enText: '<not-a-list/>1929. I caught golf fever.',
        },
      })

      expect(container.innerHTML).not.toContain('<not-a-list')
    })

    it('renders plain sentences without sentinel unchanged', () => {
      render(ParagraphRow, {
        props: {
          ...defaultProps,
          enText: 'War fever ran high.',
          etText: 'Sõjapalavik hõõgus.',
        },
      })

      expect(screen.getByText('War fever ran high.')).toBeInTheDocument()
      expect(screen.getByText('Sõjapalavik hõõgus.')).toBeInTheDocument()
    })

    it('strips orphan sentinel (no following digits) without leaking it', () => {
      const { container } = render(ParagraphRow, {
        props: {
          ...defaultProps,
          enText: '<not-a-list/>Some text without a year.',
        },
      })

      expect(container.innerHTML).not.toContain('<not-a-list')
      expect(container.innerHTML).not.toContain('not-a-list')
    })
  })
})
