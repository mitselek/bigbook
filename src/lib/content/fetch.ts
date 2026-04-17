import { BASELINE_COMMIT_SHA } from './baseline-config'

export type CurrentEtResult =
  | { status: 'unchanged' }
  | { status: 'fetched'; content: string; sha: string; etag: string }

export type FetchError = {
  kind: 'network' | 'not_found' | 'unexpected'
  message: string
  statusCode?: number
}

export type FetchResult<T> = { ok: true; value: T } | { ok: false; error: FetchError }

export async function fetchEn(chapter: string): Promise<FetchResult<string>> {
  const url = `https://raw.githubusercontent.com/mitselek/bigbook/${BASELINE_COMMIT_SHA}/src/content/en/${chapter}.md`
  const response = await fetch(url)
  return { ok: true, value: await response.text() }
}

export async function fetchBaselineEt(_chapter: string): Promise<FetchResult<string>> {
  throw new Error('not implemented')
}

export async function fetchCurrentEt(
  _chapter: string,
  _opts?: { etag?: string; token?: string },
): Promise<FetchResult<CurrentEtResult>> {
  throw new Error('not implemented')
}
