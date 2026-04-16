# P3 — Paragraph Rendering

**Phase goal:** Build `ParagraphRow.svelte` (one EN/ET paragraph pair with marginalia slot) and `Marginalia.svelte` (baseline-diff annotation with expand-to-commit-metadata). Both are Svelte 5 interactive islands, tested with `@testing-library/svelte`.

**Execution mode:** XP triple (Montano RED → Granjon GREEN → Ortelius PURPLE)

**Files:**

- Create: `src/components/ParagraphRow.svelte`
- Create: `src/components/Marginalia.svelte`
- Create: `tests/components/ParagraphRow.test.ts`
- Create: `tests/components/Marginalia.test.ts`

---

## Component interfaces

```ts
// ParagraphRow.svelte props
type ParagraphRowProps = {
  paraId: string
  enText: string
  etText: string
  isTitle: boolean
  isDiverged: boolean // true if current ET differs from baseline ET
  baselineEtText?: string // only present when isDiverged
  chapterSlug: string // for marginalia commit metadata fetch
}
```

```ts
// Marginalia.svelte props
type MarginaliaProps = {
  baselineText: string
  chapterSlug: string
}
```

**Design notes:**

- `ParagraphRow` renders the three-column layout (EN / ET / marginalia) on wide viewports. It does NOT manage its own fetch state — it receives text as props from the parent `ChapterSection` (P5).
- `Marginalia` renders the "originaal" label + baseline text. On click, it expands in-place and lazily fetches the latest commit metadata from `GET /repos/mitselek/bigbook/commits?path=src/content/et/<chapter>.md&per_page=1`.
- Both components are pure presentation — they render from props, emit no state upward except click events.

---

## Task P3.1 — ParagraphRow renders EN and ET text

**AC:** `ParagraphRow` renders `enText` in the EN column and `etText` in the ET column with correct widths and the `para-id` as the element ID.

- [ ] **RED:**

```ts
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
```

- [ ] **GREEN:** Implement `ParagraphRow.svelte` with three-column layout, rendering `enText` and `etText` in their respective columns.
- [ ] **Commit:** `test(ParagraphRow): P3.1 RED — renders EN and ET text` / `feat(ParagraphRow): P3.1 GREEN — basic paragraph pair rendering`

---

## Task P3.2 — ParagraphRow title styling

**AC:** When `isTitle` is true, the row renders with heading markup (`<h2>`) and larger font.

- [ ] **RED:**

```ts
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
```

- [ ] **GREEN:** Add conditional rendering: `{#if isTitle}<h2>{text}</h2>{:else}<p>{text}</p>{/if}` in both columns.
- [ ] **Commit:** `test(ParagraphRow): P3.2 RED — title heading style` / `feat(ParagraphRow): P3.2 GREEN — conditional heading rendering`

---

## Task P3.3 — ParagraphRow marginalia slot when diverged

**AC:** When `isDiverged` is true and `baselineEtText` is provided, the marginalia column renders a `Marginalia` component. When not diverged, the marginalia column is empty.

- [ ] **RED:**

```ts
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
```

- [ ] **GREEN:** Add `{#if isDiverged && baselineEtText}` block in the marginalia column that renders `<Marginalia baselineText={baselineEtText} chapterSlug={chapterSlug} />`.
- [ ] **Commit:** `test(ParagraphRow): P3.3 RED — marginalia rendering` / `feat(ParagraphRow): P3.3 GREEN — conditional marginalia`

---

## Task P3.4 — ParagraphRow accessibility

**AC:** Each paragraph pair has `aria-labelledby` connecting the EN and ET elements for screen readers.

- [ ] **RED:**

```ts
it('pairs EN and ET with aria-labelledby', () => {
  const { container } = render(ParagraphRow, { props: defaultProps })

  const row = container.querySelector('#ch01-p001')
  const enId = `${defaultProps.paraId}-en`
  const etId = `${defaultProps.paraId}-et`

  expect(container.querySelector(`#${enId}`)).not.toBeNull()
  expect(container.querySelector(`#${etId}`)).not.toBeNull()
  expect(row?.getAttribute('aria-labelledby')).toBe(`${enId} ${etId}`)
})
```

- [ ] **GREEN:** Add `id` attributes to EN and ET elements, add `aria-labelledby` to the row container.
- [ ] **Commit:** `test(ParagraphRow): P3.4 RED — accessibility pairing` / `feat(ParagraphRow): P3.4 GREEN — aria-labelledby`

---

## Task P3.5 — Marginalia renders label and baseline text

**AC:** `Marginalia` renders "originaal" label and the baseline ET text. Initially collapsed (shows truncated text).

- [ ] **RED:**

```ts
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
```

- [ ] **GREEN:** Implement `Marginalia.svelte` — render label + text in a styled container.
- [ ] **Commit:** `test(Marginalia): P3.5 RED — label and baseline text` / `feat(Marginalia): P3.5 GREEN — annotation rendering`

---

## Task P3.6 — Marginalia expand on click with lazy commit metadata

**AC:** Clicking the marginalia annotation expands it in-place. On expand, it lazily fetches the latest commit metadata from `GET /repos/mitselek/bigbook/commits?path=src/content/et/<chapter>.md&per_page=1` and displays the author and relative date. Click again collapses.

- [ ] **RED:**

```ts
import { fireEvent, waitFor } from '@testing-library/svelte'
import { vi } from 'vitest'

it('expands on click and shows commit metadata', async () => {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve([
          {
            commit: {
              author: { name: 'Kylli', date: '2026-04-10T12:00:00Z' },
              message: 'edit(ch01-p004): fix wording',
            },
          },
        ]),
    }),
  )

  render(Marginalia, { props: defaultProps })
  const annotation = screen.getByText('originaal')

  await fireEvent.click(annotation.closest('[role="button"]')!)

  await waitFor(() => {
    expect(screen.getByText(/Kylli/)).toBeInTheDocument()
  })
})

it('collapses on second click', async () => {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve([
          {
            commit: {
              author: { name: 'Kylli', date: '2026-04-10T12:00:00Z' },
              message: 'edit(ch01-p004): ...',
            },
          },
        ]),
    }),
  )

  render(Marginalia, { props: defaultProps })
  const btn = screen.getByRole('button')

  await fireEvent.click(btn)
  await waitFor(() => expect(screen.getByText(/Kylli/)).toBeInTheDocument())

  await fireEvent.click(btn)
  await waitFor(() => expect(screen.queryByText(/Kylli/)).not.toBeInTheDocument())
})
```

- [ ] **GREEN:** Add expand/collapse toggle state. On first expand, fetch commit metadata, cache it, display author + relative date. Use `role="button"` and `tabindex="0"` for a11y.
- [ ] **Commit:** `test(Marginalia): P3.6 RED — expand/collapse + lazy metadata` / `feat(Marginalia): P3.6 GREEN — expand with commit metadata fetch`

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
