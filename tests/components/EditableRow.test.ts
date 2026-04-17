import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/svelte'
import EditableRow from '../../src/components/EditableRow.svelte'
import { resetEditor } from '../../src/lib/editor/state.svelte'

const defaultProps = {
  paraId: 'ch01-p001',
  enText: 'We admitted we were powerless.',
  etText: 'Me tunnistasime, et oleme jõuetud.',
  isTitle: false,
  isDiverged: false,
  chapterSlug: 'ch01-billi-lugu',
}

describe('EditableRow', () => {
  beforeEach(() => {
    resetEditor()
  })

  it('shows pencil icon with correct title attribute', () => {
    render(EditableRow, { props: defaultProps })
    const pencil = screen.getByTitle('Muuda seda lõiku')
    expect(pencil).toBeInTheDocument()
  })

  it('does not show pencil for title paragraphs', () => {
    render(EditableRow, { props: { ...defaultProps, isTitle: true } })
    expect(screen.queryByTitle('Muuda seda lõiku')).not.toBeInTheDocument()
  })

  it('clicking pencil opens textarea pre-filled with ET text', async () => {
    render(EditableRow, { props: defaultProps })
    const pencil = screen.getByTitle('Muuda seda lõiku')
    await fireEvent.click(pencil)

    const textarea = screen.getByRole('textbox')
    expect(textarea).toBeInTheDocument()
    expect((textarea as HTMLTextAreaElement).value).toBe(defaultProps.etText)
  })

  it('shows no buttons when textarea is clean', async () => {
    render(EditableRow, { props: defaultProps })
    await fireEvent.click(screen.getByTitle('Muuda seda lõiku'))

    expect(screen.queryByText('Salvesta')).not.toBeInTheDocument()
    expect(screen.queryByText('Tühista')).not.toBeInTheDocument()
  })

  it('shows Salvesta and Tühista when text is modified', async () => {
    render(EditableRow, { props: defaultProps })
    await fireEvent.click(screen.getByTitle('Muuda seda lõiku'))

    const textarea = screen.getByRole('textbox')
    await fireEvent.input(textarea, { target: { value: 'Muudetud tekst.' } })

    expect(screen.getByText('Salvesta')).toBeInTheDocument()
    expect(screen.getByText('Tühista')).toBeInTheDocument()
  })

  it('Tühista reverts and exits edit mode', async () => {
    render(EditableRow, { props: defaultProps })
    await fireEvent.click(screen.getByTitle('Muuda seda lõiku'))

    const textarea = screen.getByRole('textbox')
    await fireEvent.input(textarea, { target: { value: 'Muudetud tekst.' } })
    await fireEvent.click(screen.getByText('Tühista'))

    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
    expect(screen.getByTitle('Muuda seda lõiku')).toBeInTheDocument()
  })

  it('Escape closes textarea when edit is clean', async () => {
    render(EditableRow, { props: defaultProps })
    await fireEvent.click(screen.getByTitle('Muuda seda lõiku'))

    const textarea = screen.getByRole('textbox')
    await fireEvent.keyDown(textarea, { key: 'Escape' })

    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
  })

  it('Escape does not close textarea when dirty', async () => {
    render(EditableRow, { props: defaultProps })
    await fireEvent.click(screen.getByTitle('Muuda seda lõiku'))

    const textarea = screen.getByRole('textbox')
    await fireEvent.input(textarea, { target: { value: 'Muudetud tekst.' } })
    await fireEvent.keyDown(textarea, { key: 'Escape' })

    expect(screen.getByRole('textbox')).toBeInTheDocument()
  })

  it('Salvesta calls onSave with paraId and new text', async () => {
    const onSave = vi.fn()
    render(EditableRow, { props: { ...defaultProps, onSave } })
    await fireEvent.click(screen.getByTitle('Muuda seda lõiku'))

    const textarea = screen.getByRole('textbox')
    await fireEvent.input(textarea, { target: { value: 'Uus tekst.' } })
    await fireEvent.click(screen.getByText('Salvesta'))

    expect(onSave).toHaveBeenCalledWith('ch01-p001', 'Uus tekst.')
  })
})
