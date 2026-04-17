import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/svelte'
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

  it('calls onSelect and onClose when entry is clicked', async () => {
    const onSelect = vi.fn()
    const onClose = vi.fn()
    render(TocOverlay, { props: { ...defaultProps, onSelect, onClose } })

    const entry = screen.getByText(/Bill's Story/).closest('[role="option"]')!
    await fireEvent.click(entry)

    expect(onSelect).toHaveBeenCalledWith('ch01-billi-lugu')
    expect(onClose).toHaveBeenCalled()
  })

  it('calls onClose when backdrop is clicked', async () => {
    const onClose = vi.fn()
    render(TocOverlay, { props: { ...defaultProps, onClose } })

    const backdrop = screen.getByRole('dialog').querySelector('.toc-backdrop')!
    await fireEvent.click(backdrop)

    expect(onClose).toHaveBeenCalled()
  })

  it('navigates entries with arrow keys', async () => {
    render(TocOverlay, { props: defaultProps })

    const dialog = screen.getByRole('dialog')

    await fireEvent.keyDown(dialog, { key: 'ArrowDown' })
    const entries = screen.getAllByRole('option')
    expect(entries[0]).toHaveAttribute('data-focused', 'true')

    await fireEvent.keyDown(dialog, { key: 'ArrowDown' })
    expect(entries[0]).not.toHaveAttribute('data-focused', 'true')
    expect(entries[1]).toHaveAttribute('data-focused', 'true')
  })

  it('selects focused entry on Enter', async () => {
    const onSelect = vi.fn()
    render(TocOverlay, { props: { ...defaultProps, onSelect } })

    const dialog = screen.getByRole('dialog')
    await fireEvent.keyDown(dialog, { key: 'ArrowDown' })
    await fireEvent.keyDown(dialog, { key: 'Enter' })

    expect(onSelect).toHaveBeenCalled()
  })

  it('closes on Escape', async () => {
    const onClose = vi.fn()
    render(TocOverlay, { props: { ...defaultProps, onClose } })

    const dialog = screen.getByRole('dialog')
    await fireEvent.keyDown(dialog, { key: 'Escape' })

    expect(onClose).toHaveBeenCalled()
  })
})
