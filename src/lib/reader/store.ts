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
