import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createPreloadObserver } from '../../../src/lib/reader/scroll-anchor'

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
