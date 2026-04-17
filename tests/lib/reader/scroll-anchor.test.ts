import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createPreloadObserver, createTitleObserver } from '../../../src/lib/reader/scroll-anchor'

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
    vi.fn((cb: IntersectionObserverCallback) => {
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

describe('store initialization', () => {
  it('is importable and exports readerState shape', async () => {
    const mod = await import('../../../src/lib/reader/store')
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
