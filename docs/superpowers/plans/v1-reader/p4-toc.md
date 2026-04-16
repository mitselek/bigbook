# P4 — TOC Overlay

**Phase goal:** Build `TocOverlay.svelte` — a full-screen grouped TOC overlay with toggle dismiss, keyboard navigation, and bilingual chapter titles.

**Execution mode:** XP triple (Montano RED → Granjon GREEN → Ortelius PURPLE)

**Files:**

- Create: `src/components/TocOverlay.svelte`
- Create: `tests/components/TocOverlay.test.ts`

---

## Component interface

```ts
// TocOverlay.svelte props
type TocOverlayProps = {
  chapters: readonly ChapterManifest[] // from manifest.ts
  isOpen: boolean
  onSelect: (slug: string) => void // called when user picks a chapter
  onClose: () => void // called on dismiss
}
```

**Design notes:**

- Grouping logic: slugs starting with `ch` are "Chapters"; `cover`, `eessonad`, `arsti-arvamus` are "Front matter"; `lisad`, `index` are "Appendices". Derived from a static map inside the component.
- Each entry renders bilingual title from `ChapterManifest.title.en` and `ChapterManifest.title.et` (strip `# ` heading prefix from manifest titles).
- Keyboard: arrow keys navigate between entries, Enter selects, Esc closes.
- Dismiss: Esc, click outside the TOC list, or the parent toggles `isOpen` (which implements the "click center title again" behavior).

---

## Task P4.1 — TocOverlay renders grouped chapters

**AC:** When `isOpen` is true, the overlay renders all chapters grouped under "Front matter", "Chapters", and "Appendices" section headers. Each entry shows bilingual title.

- [ ] **RED:**

```ts
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
```

- [ ] **GREEN:** Implement `TocOverlay.svelte` with grouping logic, conditional rendering on `isOpen`, and bilingual title display.
- [ ] **Commit:** `test(TocOverlay): P4.1 RED — grouped chapter rendering` / `feat(TocOverlay): P4.1 GREEN — grouped TOC with bilingual titles`

---

## Task P4.2 — TocOverlay click to select and dismiss

**AC:** Clicking a chapter entry calls `onSelect(slug)` and `onClose()`. Clicking the overlay backdrop (outside the list) calls `onClose()`.

- [ ] **RED:**

```ts
import { fireEvent } from '@testing-library/svelte'
import { vi } from 'vitest'

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
```

- [ ] **GREEN:** Add click handlers on entries and backdrop. Entries call both `onSelect` and `onClose`. Backdrop calls `onClose`.
- [ ] **Commit:** `test(TocOverlay): P4.2 RED — click select and dismiss` / `feat(TocOverlay): P4.2 GREEN — click handlers`

---

## Task P4.3 — TocOverlay keyboard navigation

**AC:** Arrow keys move a visual focus indicator between entries. Enter selects the focused entry. Esc closes the overlay.

- [ ] **RED:**

```ts
it('navigates entries with arrow keys', async () => {
  render(TocOverlay, { props: defaultProps })

  const dialog = screen.getByRole('dialog')

  await fireEvent.keyDown(dialog, { key: 'ArrowDown' })
  // First entry should have focus indicator
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
```

- [ ] **GREEN:** Add `keydown` event handler on the dialog. Track `focusedIndex` state. Arrow keys increment/decrement (wrapping). Enter fires `onSelect` for focused entry. Esc fires `onClose`. Use `role="dialog"` and `role="option"` for a11y.
- [ ] **Commit:** `test(TocOverlay): P4.3 RED — keyboard navigation` / `feat(TocOverlay): P4.3 GREEN — arrow keys, Enter, Esc`

---

## Task P4.4 — TocOverlay focus trap and auto-focus

**AC:** When the overlay opens, focus moves to the dialog. Tab is trapped within the overlay (does not escape to the page behind). On close, focus returns to the trigger element.

- [ ] **RED:**

```ts
it('focuses the dialog on open', () => {
  render(TocOverlay, { props: defaultProps })

  const dialog = screen.getByRole('dialog')
  expect(document.activeElement).toBe(dialog)
})

it('traps Tab within the overlay', async () => {
  render(TocOverlay, { props: defaultProps })

  const dialog = screen.getByRole('dialog')
  await fireEvent.keyDown(dialog, { key: 'Tab' })

  // Focus should stay within the dialog
  expect(dialog.contains(document.activeElement)).toBe(true)
})
```

- [ ] **GREEN:** Use `onMount` → `dialog.focus()`. Add Tab trap logic (on Tab at last focusable, wrap to first; on Shift+Tab at first, wrap to last).
- [ ] **Commit:** `test(TocOverlay): P4.4 RED — focus trap` / `feat(TocOverlay): P4.4 GREEN — auto-focus and Tab trap`

---

## Phase-exit gate

```bash
npm run typecheck
npm run lint
npm run format:check
npm run test
npm run build
```

(_BB:Plantin_)
