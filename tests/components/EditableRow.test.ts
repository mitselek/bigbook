import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/svelte'
import EditableRow from '../../src/components/EditableRow.svelte'
import { resetEditor } from '../../src/lib/editor/state.svelte'

// Helper: flush both microtask queue AND one macrotask tick. EditableRow's
// click-outside guard uses setTimeout(0) to defer listener installation past
// the current event dispatch; tests must advance the macrotask queue for the
// listener to be armed before dispatching the "click outside" event.
function flushMicrotasks(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0))
}

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

  // --- New tests: document-level Escape and outside-click ---

  it('Escape on document closes a clean editor', async () => {
    render(EditableRow, { props: defaultProps })
    await fireEvent.click(screen.getByTitle('Muuda seda lõiku'))
    await flushMicrotasks()

    await fireEvent.keyDown(document.body, { key: 'Escape' })

    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
  })

  it('Escape on document is a no-op when editor is dirty', async () => {
    render(EditableRow, { props: defaultProps })
    await fireEvent.click(screen.getByTitle('Muuda seda lõiku'))
    await flushMicrotasks()

    const textarea = screen.getByRole('textbox')
    await fireEvent.input(textarea, { target: { value: 'Muudetud tekst.' } })
    await fireEvent.keyDown(document.body, { key: 'Escape' })

    expect(screen.getByRole('textbox')).toBeInTheDocument()
  })

  it('click outside the edit-row closes a clean editor', async () => {
    render(EditableRow, { props: defaultProps })
    await fireEvent.click(screen.getByTitle('Muuda seda lõiku'))
    await flushMicrotasks()

    await fireEvent.click(document.body)

    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
  })

  it('click outside is a no-op when editor is dirty', async () => {
    render(EditableRow, { props: defaultProps })
    await fireEvent.click(screen.getByTitle('Muuda seda lõiku'))
    await flushMicrotasks()

    const textarea = screen.getByRole('textbox')
    await fireEvent.input(textarea, { target: { value: 'Muudetud tekst.' } })
    await fireEvent.click(document.body)

    expect(screen.getByRole('textbox')).toBeInTheDocument()
  })

  it('click inside the edit-row does NOT close the editor', async () => {
    render(EditableRow, { props: defaultProps })
    await fireEvent.click(screen.getByTitle('Muuda seda lõiku'))
    await flushMicrotasks()

    const textarea = screen.getByRole('textbox')
    await fireEvent.click(textarea)

    expect(screen.getByRole('textbox')).toBeInTheDocument()
  })

  // --- New tests: Ctrl/Cmd+Enter commit shortcut ---

  it('Ctrl+Enter when dirty calls onSave with (paraId, currentText)', async () => {
    const onSave = vi.fn()
    render(EditableRow, { props: { ...defaultProps, onSave } })
    await fireEvent.click(screen.getByTitle('Muuda seda lõiku'))
    await flushMicrotasks()

    const textarea = screen.getByRole('textbox')
    await fireEvent.input(textarea, { target: { value: 'Muudetud Ctrl+Enter.' } })
    await fireEvent.keyDown(document.body, { key: 'Enter', ctrlKey: true })

    expect(onSave).toHaveBeenCalledWith('ch01-p001', 'Muudetud Ctrl+Enter.')
  })

  it('Cmd+Enter (metaKey) when dirty calls onSave — macOS path', async () => {
    const onSave = vi.fn()
    render(EditableRow, { props: { ...defaultProps, onSave } })
    await fireEvent.click(screen.getByTitle('Muuda seda lõiku'))
    await flushMicrotasks()

    const textarea = screen.getByRole('textbox')
    await fireEvent.input(textarea, { target: { value: 'Muudetud Cmd+Enter.' } })
    await fireEvent.keyDown(document.body, { key: 'Enter', metaKey: true })

    expect(onSave).toHaveBeenCalledWith('ch01-p001', 'Muudetud Cmd+Enter.')
  })

  it('Ctrl+Enter on clean editor is a no-op (onSave not called)', async () => {
    const onSave = vi.fn()
    render(EditableRow, { props: { ...defaultProps, onSave } })
    await fireEvent.click(screen.getByTitle('Muuda seda lõiku'))
    await flushMicrotasks()

    // Do NOT modify text — editor is clean (not dirty)
    await fireEvent.keyDown(document.body, { key: 'Enter', ctrlKey: true })

    expect(onSave).not.toHaveBeenCalled()
  })

  it('Shift+Ctrl+Enter is a no-op (modifier exclusion)', async () => {
    const onSave = vi.fn()
    render(EditableRow, { props: { ...defaultProps, onSave } })
    await fireEvent.click(screen.getByTitle('Muuda seda lõiku'))
    await flushMicrotasks()

    const textarea = screen.getByRole('textbox')
    await fireEvent.input(textarea, { target: { value: 'Muudetud tekst.' } })
    await fireEvent.keyDown(document.body, { key: 'Enter', ctrlKey: true, shiftKey: true })

    expect(onSave).not.toHaveBeenCalled()
  })

  it('plain Enter is a no-op (does not commit)', async () => {
    const onSave = vi.fn()
    render(EditableRow, { props: { ...defaultProps, onSave } })
    await fireEvent.click(screen.getByTitle('Muuda seda lõiku'))
    await flushMicrotasks()

    const textarea = screen.getByRole('textbox')
    await fireEvent.input(textarea, { target: { value: 'Muudetud tekst.' } })
    await fireEvent.keyDown(document.body, { key: 'Enter' })

    expect(onSave).not.toHaveBeenCalled()
  })

  it('switching pencil from paragraph A to B does not close B editor (race guard)', async () => {
    const propsA = { ...defaultProps, paraId: 'ch01-p001' }
    const propsB = { ...defaultProps, paraId: 'ch01-p002', etText: 'Teine lõik.' }

    const container = document.createElement('div')
    document.body.appendChild(container)

    render(EditableRow, { props: propsA, target: container })
    render(EditableRow, { props: propsB, target: container })

    // Click pencil on A
    const pencils = screen.getAllByTitle('Muuda seda lõiku')
    const pencilA = pencils[0]
    if (pencilA === undefined) throw new Error('No pencil for A')
    await fireEvent.click(pencilA)
    await flushMicrotasks()

    // Click pencil on B (should cancel A then start B)
    const pencilsAfterA = screen.getAllByTitle('Muuda seda lõiku')
    const pencilB = pencilsAfterA[0]
    if (pencilB === undefined) throw new Error('No pencil for B')
    await fireEvent.click(pencilB)
    await flushMicrotasks()

    // B's editor should be open (textarea present with B's text)
    const textarea = screen.getByRole('textbox')
    expect(textarea).toBeInTheDocument()
    expect((textarea as HTMLTextAreaElement).value).toBe('Teine lõik.')

    container.remove()
  })
})
