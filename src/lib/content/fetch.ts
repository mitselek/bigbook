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

async function fetchRawGithub(lang: 'en' | 'et', chapter: string): Promise<FetchResult<string>> {
  const url = `https://raw.githubusercontent.com/mitselek/bigbook/${BASELINE_COMMIT_SHA}/src/content/${lang}/${chapter}.md`
  try {
    const response = await fetch(url)
    if (!response.ok) {
      if (response.status === 404) {
        return {
          ok: false,
          error: { kind: 'not_found', message: response.statusText, statusCode: 404 },
        }
      }
      return {
        ok: false,
        error: { kind: 'unexpected', message: response.statusText, statusCode: response.status },
      }
    }
    return { ok: true, value: await response.text() }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return { ok: false, error: { kind: 'network', message } }
  }
}

export async function fetchEn(chapter: string): Promise<FetchResult<string>> {
  return fetchRawGithub('en', chapter)
}

export async function fetchBaselineEt(chapter: string): Promise<FetchResult<string>> {
  return fetchRawGithub('et', chapter)
}

export async function fetchCurrentEt(
  _chapter: string,
  _opts?: { etag?: string; token?: string },
): Promise<FetchResult<CurrentEtResult>> {
  throw new Error('not implemented')
}
