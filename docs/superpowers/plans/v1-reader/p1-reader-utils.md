# P1 — Reader Utilities

**Phase goal:** Build `src/lib/reader/scroll-anchor.ts` (IntersectionObserver logic), `src/lib/reader/local-state.ts` (localStorage wrapper), and `src/lib/reader/store.ts` (shared reactive state for cross-island communication).

**Execution mode:** XP triple (Montano RED → Granjon GREEN → Ortelius PURPLE)

**Files:**

- Create: `src/lib/reader/scroll-anchor.ts`
- Create: `src/lib/reader/local-state.ts`
- Create: `src/lib/reader/store.ts`
- Create: `tests/lib/reader/scroll-anchor.test.ts`
- Create: `tests/lib/reader/local-state.test.ts`

---

## Module interfaces

```ts
// src/lib/reader/scroll-anchor.ts

export type ChapterVisibilityCallback = (slug: string, isVisible: boolean) => void

export type ScrollAnchorController = {
  observe: (element: HTMLElement, slug: string) => void
  disconnect: () => void
}

/** Track which chapter title is closest to the top of the viewport. */
export type CurrentChapterCallback = (slug: string) => void

export function createPreloadObserver(
  callback: ChapterVisibilityCallback,
  rootMargin?: string,
): ScrollAnchorController

export function createTitleObserver(callback: CurrentChapterCallback): ScrollAnchorController
```

```ts
// src/lib/reader/local-state.ts

const LAST_PARA_KEY = 'bigbook.lastParaId'

export function getLastParaId(): string | null
export function setLastParaId(paraId: string): void
```

```ts
// src/lib/reader/store.ts
// Svelte 5 runes-compatible reactive state for cross-island communication.
// Uses $state() so Svelte components can subscribe reactively.

export type ChapterLoadState =
  | { status: 'skeleton' }
  | { status: 'loading' }
  | {
      status: 'loaded'
      en: string
      baselineEt: string
      currentEt: string
      sha: string
      etag: string
    }
  | { status: 'error'; message: string }

export const readerState: {
  currentChapter: string
  chapterStates: Map<string, ChapterLoadState>
}
```

**Design notes:**

- `scroll-anchor.ts` is pure IntersectionObserver logic — no Svelte, no DOM manipulation. Takes callback functions. Testable with a mock IntersectionObserver.
- `createPreloadObserver` uses `rootMargin: '150% 0px'` by default for the 1.5-viewport preload buffer. `createTitleObserver` uses `rootMargin: '0px 0px -90% 0px'` to fire when a title enters the top 10% of the viewport.
- `local-state.ts` is a thin wrapper around `localStorage` with try/catch for storage-full and private-browsing edge cases.
- `store.ts` uses Svelte 5's `$state` rune for reactive state. It's importable by both Svelte components and plain TS modules (non-reactive reads).

---

## Task P1.1 — createPreloadObserver

**AC:** `createPreloadObserver` creates an IntersectionObserver that calls `callback(slug, true)` when an element enters the preload margin and `callback(slug, false)` when it exits.

- [ ] **RED:**

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createPreloadObserver } from '../../../src/lib/reader/scroll-anchor'

// Mock IntersectionObserver
class MockIntersectionObserver {
  callback: IntersectionObserverCallback
  elements: Element[] = []
  constructor(callback: IntersectionObserverCallback) {
    this.callback = callback
  }
  observe(el: Element) {
    this.elements.push(el)
  }
  disconnect() {
    this.elements = []
  }
  unobserve() {}
  // Helper to simulate entries
  trigger(entries: Partial<IntersectionObserverEntry>[]) {
    this.callback(entries as IntersectionObserverEntry[], this as unknown as IntersectionObserver)
  }
  get root() {
    return null
  }
  get rootMargin() {
    return ''
  }
  get thresholds() {
    return []
  }
  takeRecords() {
    return []
  }
}

describe('createPreloadObserver', () => {
  let mockObserverInstance: MockIntersectionObserver

  beforeEach(() => {
    mockObserverInstance = undefined as unknown as MockIntersectionObserver
    vi.stubGlobal(
      'IntersectionObserver',
      vi.fn((cb: IntersectionObserverCallback) => {
        mockObserverInstance = new MockIntersectionObserver(cb)
        return mockObserverInstance
      }),
    )
  })

  it('calls callback with (slug, true) when element enters preload margin', () => {
    const callback = vi.fn()
    const controller = createPreloadObserver(callback)
    const el = document.createElement('section')
    el.dataset.chapterSlug = 'ch01-billi-lugu'
    controller.observe(el, 'ch01-billi-lugu')

    mockObserverInstance.trigger([{ target: el, isIntersecting: true }])

    expect(callback).toHaveBeenCalledWith('ch01-billi-lugu', true)
  })

  it('calls callback with (slug, false) when element exits', () => {
    const callback = vi.fn()
    const controller = createPreloadObserver(callback)
    const el = document.createElement('section')
    controller.observe(el, 'ch01-billi-lugu')

    mockObserverInstance.trigger([{ target: el, isIntersecting: false }])

    expect(callback).toHaveBeenCalledWith('ch01-billi-lugu', false)
  })

  it('disconnect stops observing all elements', () => {
    const callback = vi.fn()
    const controller = createPreloadObserver(callback)
    controller.disconnect()

    expect(mockObserverInstance.elements).toEqual([])
  })
})
```

- [ ] **GREEN:** Implement `createPreloadObserver` — creates an IntersectionObserver with `rootMargin: '150% 0px'`, maintains a `Map<Element, string>` for slug lookups.
- [ ] **Commit:** `test(scroll-anchor): P1.1 RED — createPreloadObserver` / `feat(scroll-anchor): P1.1 GREEN — preload observer with 1.5-viewport margin`

---

## Task P1.2 — createTitleObserver

**AC:** `createTitleObserver` calls `callback(slug)` when a chapter title element enters the top 10% of the viewport. Only fires for the topmost intersecting title.

- [ ] **RED:**

```ts
describe('createTitleObserver', () => {
  it('calls callback with slug of intersecting title', () => {
    const callback = vi.fn()
    const controller = createTitleObserver(callback)
    const el = document.createElement('h2')
    controller.observe(el, 'ch03-alkoholismist-l')

    mockObserverInstance.trigger([{ target: el, isIntersecting: true }])

    expect(callback).toHaveBeenCalledWith('ch03-alkoholismist-l')
  })

  it('does not fire callback when title exits', () => {
    const callback = vi.fn()
    const controller = createTitleObserver(callback)
    const el = document.createElement('h2')
    controller.observe(el, 'ch03-alkoholismist-l')

    mockObserverInstance.trigger([{ target: el, isIntersecting: false }])

    expect(callback).not.toHaveBeenCalled()
  })
})
```

- [ ] **GREEN:** Implement `createTitleObserver` with `rootMargin: '0px 0px -90% 0px'` (fires when title in top 10% of viewport).
- [ ] **Commit:** `test(scroll-anchor): P1.2 RED — createTitleObserver` / `feat(scroll-anchor): P1.2 GREEN — title observer for top-bar sync`

---

## Task P1.3 — local-state getLastParaId / setLastParaId

**AC:** `getLastParaId()` returns the stored value or null. `setLastParaId()` persists to localStorage. Both handle storage-full and private-browsing gracefully (return null / silently fail).

- [ ] **RED:**

```ts
import { describe, it, expect, beforeEach } from 'vitest'
import { getLastParaId, setLastParaId } from '../../../src/lib/reader/local-state'

describe('local-state', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('returns null when no value stored', () => {
    expect(getLastParaId()).toBeNull()
  })

  it('round-trips a para-id', () => {
    setLastParaId('ch05-p003')
    expect(getLastParaId()).toBe('ch05-p003')
  })

  it('overwrites previous value', () => {
    setLastParaId('ch01-p001')
    setLastParaId('ch08-p012')
    expect(getLastParaId()).toBe('ch08-p012')
  })

  it('returns null gracefully when localStorage throws on read', () => {
    const orig = Storage.prototype.getItem
    Storage.prototype.getItem = () => {
      throw new DOMException('SecurityError')
    }
    expect(getLastParaId()).toBeNull()
    Storage.prototype.getItem = orig
  })

  it('does not throw when localStorage throws on write', () => {
    const orig = Storage.prototype.setItem
    Storage.prototype.setItem = () => {
      throw new DOMException('QuotaExceededError')
    }
    expect(() => setLastParaId('ch01-p001')).not.toThrow()
    Storage.prototype.setItem = orig
  })
})
```

- [ ] **GREEN:** Implement both functions with try/catch.
- [ ] **Commit:** `test(local-state): P1.3 RED — localStorage round-trip + error handling` / `feat(local-state): P1.3 GREEN — lastParaId persistence`

---

## Task P1.4 — store.ts reactive state shape

**AC:** `readerState` exports a reactive object with `currentChapter` (string) and `chapterStates` (Map). Initializable from manifest slugs. Updatable.

- [ ] **RED (regression):** This is a type + initialization test. The store uses Svelte 5 `$state` runes which cannot be tested outside a Svelte compilation context in Vitest with jsdom. Instead, test the non-reactive exported helpers:

```ts
// This task tests the store's initialization logic as a plain module import.
// Svelte reactivity is integration-tested in P5 (runtime wiring).
// No separate test file — add to scroll-anchor.test.ts as a describe block.

import { describe, it, expect } from 'vitest'

describe('store initialization', () => {
  it('is importable and exports readerState shape', async () => {
    // Dynamic import to avoid Svelte rune compilation in test context
    const mod = await import('../../../src/lib/reader/store')
    expect(mod.readerState).toBeDefined()
    expect(typeof mod.readerState.currentChapter).toBe('string')
    expect(mod.readerState.chapterStates).toBeInstanceOf(Map)
  })
})
```

**Note:** If Svelte 5 `$state` runes cause compilation errors in Vitest's jsdom env, the store should export a plain object with getter/setter functions instead of runes. The GREEN implementation decides the concrete reactive pattern based on what works in the test environment. Svelte reactivity is verified in component tests (P3, P5), not here.

- [ ] **GREEN:** Implement `store.ts` — export a `readerState` object. If `$state` runes compile in Vitest, use them. If not, use a plain object with a subscribe pattern (Svelte 5 supports both). Initialize `chapterStates` as an empty Map and `currentChapter` as `''`.
- [ ] **Commit:** `test(store): P1.4 — reader state shape importable` / `feat(store): P1.4 — shared reactive state for cross-island communication`

---

## Task P1.5 — store helper: initializeChapterStates

**AC:** A helper function `initializeChapterStates(slugs: string[])` populates `chapterStates` with `{ status: 'skeleton' }` for each slug.

- [ ] **RED:**

```ts
describe('initializeChapterStates', () => {
  it('populates chapterStates with skeleton status for each slug', async () => {
    const { readerState, initializeChapterStates } = await import('../../../src/lib/reader/store')
    initializeChapterStates(['ch01-billi-lugu', 'ch02-lahendus-on-ole'])

    expect(readerState.chapterStates.get('ch01-billi-lugu')).toEqual({
      status: 'skeleton',
    })
    expect(readerState.chapterStates.get('ch02-lahendus-on-ole')).toEqual({
      status: 'skeleton',
    })
    expect(readerState.chapterStates.size).toBe(2)
  })
})
```

- [ ] **GREEN:** Implement `initializeChapterStates` — iterate slugs, set each to `{ status: 'skeleton' }`.
- [ ] **Commit:** `test(store): P1.5 RED — initializeChapterStates` / `feat(store): P1.5 GREEN — chapter state initialization`

---

## Phase-exit gate

```bash
npm run typecheck
npm run lint
npm run format:check
npm run test
npm run test:coverage   # src/lib/ ≥90% lines, ≥85% branches
npm run build
```

(_BB:Plantin_)
