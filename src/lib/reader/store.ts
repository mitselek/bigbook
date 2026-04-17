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
} = {
  currentChapter: '',
  chapterStates: new Map(),
}

export function initializeChapterStates(slugs: string[]): void {
  readerState.chapterStates.clear()
  for (const slug of slugs) {
    readerState.chapterStates.set(slug, { status: 'skeleton' })
  }
}
