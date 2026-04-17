export type ChapterVisibilityCallback = (slug: string, isVisible: boolean) => void

export type ScrollAnchorController = {
  observe: (element: HTMLElement, slug: string) => void
  disconnect: () => void
}

export type CurrentChapterCallback = (slug: string) => void

export function createPreloadObserver(
  _callback: ChapterVisibilityCallback,
  _rootMargin?: string,
): ScrollAnchorController {
  throw new Error('not implemented')
}

export function createTitleObserver(_callback: CurrentChapterCallback): ScrollAnchorController {
  throw new Error('not implemented')
}
