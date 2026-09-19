import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  createPreloadObserver,
  createTitleObserver,
  createFocusObserver,
} from '../../../src/lib/reader/scroll-anchor'

let mockObserverInstance: MockIntersectionObserver

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

beforeEach(() => {
  mockObserverInstance = undefined as unknown as MockIntersectionObserver
  vi.stubGlobal(
    'IntersectionObserver',
    vi.fn(function (this: unknown, cb: IntersectionObserverCallback) {
      mockObserverInstance = new MockIntersectionObserver(cb)
      return mockObserverInstance
    }),
  )
})

describe('createPreloadObserver', () => {
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

  it('uses the given rootMargin when one is passed', () => {
    const callback = vi.fn()
    createPreloadObserver(callback, '200% 0px')
    const mockCtor = IntersectionObserver as unknown as { mock: { calls: unknown[] } }
    expect(mockCtor.mock.calls).toMatchObject([[expect.anything(), { rootMargin: '200% 0px' }]])
  })

  it('defaults rootMargin to 150% 0px when omitted', () => {
    const callback = vi.fn()
    createPreloadObserver(callback)
    const mockCtor = IntersectionObserver as unknown as { mock: { calls: unknown[] } }
    expect(mockCtor.mock.calls).toMatchObject([[expect.anything(), { rootMargin: '150% 0px' }]])
  })
})

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

describe('createFocusObserver', () => {
  it('calls callback with the paraId when the observed element is intersecting', () => {
    const callback = vi.fn()
    const controller = createFocusObserver(callback)
    const el = document.createElement('p')
    controller.observe(el, 'ch01-p007')

    mockObserverInstance.trigger([{ target: el, isIntersecting: true }])

    expect(callback).toHaveBeenCalledWith('ch01-p007')
  })

  it('does not call callback when the element is not intersecting', () => {
    const callback = vi.fn()
    const controller = createFocusObserver(callback)
    const el = document.createElement('p')
    controller.observe(el, 'ch01-p007')

    mockObserverInstance.trigger([{ target: el, isIntersecting: false }])

    expect(callback).not.toHaveBeenCalled()
  })

  it('constructs the observer with rootMargin -33% 0px -67% 0px', () => {
    const callback = vi.fn()
    createFocusObserver(callback)
    const mockCtor = IntersectionObserver as unknown as { mock: { calls: unknown[] } }
    expect(mockCtor.mock.calls).toMatchObject([
      [expect.anything(), { rootMargin: '-33% 0px -67% 0px' }],
    ])
  })

  it('disconnect clears the observed elements', () => {
    const callback = vi.fn()
    const controller = createFocusObserver(callback)
    const el = document.createElement('p')
    controller.observe(el, 'ch01-p007')
    controller.disconnect()

    expect(mockObserverInstance.elements).toEqual([])
  })
})

describe('store initialization', () => {
  it('is importable and exports readerState shape', async () => {
    const mod = await import('../../../src/lib/reader/store.svelte')
    expect(mod.readerState).toBeDefined()
    expect(typeof mod.readerState.currentChapter).toBe('string')
    expect(mod.readerState.chapterStates).toBeInstanceOf(Map)
  })
})

describe('initializeChapterStates', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  it('populates chapterStates with skeleton status for each slug', async () => {
    const { readerState, initializeChapterStates } =
      await import('../../../src/lib/reader/store.svelte')
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
