import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/svelte'
import Marginalia from '../../src/components/Marginalia.svelte'

describe('Marginalia', () => {
  const defaultProps = {
    baselineText: 'Kujutlesin, et juhtimisanne viib mu suurte ettevõtmiste etteotsa.',
    chapterSlug: 'ch01-billi-lugu',
  }

  it('renders "originaal" label', () => {
    render(Marginalia, { props: defaultProps })

    expect(screen.getByText('originaal')).toBeInTheDocument()
  })

  it('renders baseline text', () => {
    render(Marginalia, { props: defaultProps })

    expect(screen.getByText(/Kujutlesin/)).toBeInTheDocument()
  })
})
