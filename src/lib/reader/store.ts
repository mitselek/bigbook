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
  tocOpen: boolean
  chapterStates: Map<string, ChapterLoadState>
} = {
  currentChapter: '',
  tocOpen: false,
  chapterStates: new Map(),
}

export function initializeChapterStates(slugs: string[]): void {
  readerState.chapterStates.clear()
  for (const slug of slugs) {
    readerState.chapterStates.set(slug, { status: 'skeleton' })
  }
}
