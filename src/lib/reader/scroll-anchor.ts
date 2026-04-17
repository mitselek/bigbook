export type ChapterVisibilityCallback = (slug: string, isVisible: boolean) => void

export type ScrollAnchorController = {
  observe: (element: HTMLElement, slug: string) => void
  disconnect: () => void
}

export type CurrentChapterCallback = (slug: string) => void

export function createPreloadObserver(
  callback: ChapterVisibilityCallback,
  rootMargin?: string,
): ScrollAnchorController {
  const slugMap = new Map<Element, string>()
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        const slug = slugMap.get(entry.target)
        if (slug !== undefined) callback(slug, entry.isIntersecting)
      }
    },
    { rootMargin: rootMargin ?? '150% 0px' },
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

export function createTitleObserver(_callback: CurrentChapterCallback): ScrollAnchorController {
  throw new Error('not implemented')
}
