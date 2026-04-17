export type ChapterVisibilityCallback = (slug: string, isVisible: boolean) => void

export type ScrollAnchorController = {
  observe: (element: HTMLElement, slug: string) => void
  disconnect: () => void
}

export type CurrentChapterCallback = (slug: string) => void

function makeSlugObserver(
  rootMargin: string,
  onEntry: (slug: string, entry: IntersectionObserverEntry) => void,
): ScrollAnchorController {
  const slugMap = new Map<Element, string>()
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        const slug = slugMap.get(entry.target)
        if (slug !== undefined) onEntry(slug, entry)
      }
    },
    { rootMargin },
  )
  return {
    observe(el: HTMLElement, slug: string) {
      slugMap.set(el, slug)
      observer.observe(el)
    },
    disconnect() {
      observer.disconnect()
    },
  }
}

export function createPreloadObserver(
  callback: ChapterVisibilityCallback,
  rootMargin?: string,
): ScrollAnchorController {
  return makeSlugObserver(rootMargin ?? '150% 0px', (slug, entry) =>
    callback(slug, entry.isIntersecting),
  )
}

export function createTitleObserver(callback: CurrentChapterCallback): ScrollAnchorController {
  return makeSlugObserver('0px 0px -90% 0px', (slug, entry) => {
    if (entry.isIntersecting) callback(slug)
  })
}

export type FocusCallback = (paraId: string) => void

export function createFocusObserver(callback: FocusCallback): ScrollAnchorController {
  return makeSlugObserver('-33% 0px -67% 0px', (paraId, entry) => {
    if (entry.isIntersecting) callback(paraId)
  })
}
