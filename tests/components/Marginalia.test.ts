import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/svelte'
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

  describe('expand/collapse', () => {
    const mockCommitResponse = [
      {
        commit: {
          author: { name: 'Kylli', date: '2026-04-10T12:00:00Z' },
          message: 'edit(ch01-p004): fix wording',
        },
      },
    ]

    beforeEach(() => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: true,
          json: () => Promise.resolve(mockCommitResponse),
        }),
      )
    })

    afterEach(() => {
      vi.restoreAllMocks()
    })

    it('expands on click and shows commit metadata', async () => {
      render(Marginalia, { props: defaultProps })

      await fireEvent.click(screen.getByRole('button'))

      await waitFor(() => {
        expect(screen.getByText(/Kylli/)).toBeInTheDocument()
      })

      const fetchMock = vi.mocked(fetch)
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringMatching(
          /api\.github\.com\/repos\/mitselek\/bigbook\/commits.*path=src\/content\/et\/ch01-billi-lugu\.md.*per_page=1/,
        ),
      )
    })

    it('collapses on second click', async () => {
      render(Marginalia, { props: defaultProps })

      const btn = screen.getByRole('button')

      await fireEvent.click(btn)
      await waitFor(() => expect(screen.getByText(/Kylli/)).toBeInTheDocument())

      await fireEvent.click(btn)
      await waitFor(() => expect(screen.queryByText(/Kylli/)).not.toBeInTheDocument())
    })
  })
})
