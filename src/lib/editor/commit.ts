import { replaceParaText } from '../content/serialize'

export type CommitResult =
  | { ok: true; newSha: string }
  | { ok: false; kind: 'conflict'; message: string }
  | { ok: false; kind: 'auth_expired'; message: string }
  | { ok: false; kind: 'not_found'; message: string }
  | { ok: false; kind: 'network'; message: string }
  | { ok: false; kind: 'unexpected'; message: string; statusCode: number }

interface CommitParams {
  slug: string
  paraId: string
  newText: string
  currentContent: string
  sha: string
  token: string
}

export async function commitParagraphEdit(params: CommitParams): Promise<CommitResult> {
  const { slug, paraId, newText, currentContent, sha, token } = params

  const updatedContent = replaceParaText(currentContent, paraId, newText)
  const encoded = btoa(
    Array.from(new TextEncoder().encode(updatedContent), (b) => String.fromCharCode(b)).join(''),
  )

  const url = `https://api.github.com/repos/mitselek/bigbook/contents/src/content/et/${slug}.md`

  try {
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${token}`,
        'X-GitHub-Api-Version': '2022-11-28',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: `Muuda ${paraId} (et)`,
        content: encoded,
        sha,
      }),
    })

    if (response.status === 409) {
      return { ok: false, kind: 'conflict', message: response.statusText }
    }
    if (response.status === 401) {
      return { ok: false, kind: 'auth_expired', message: response.statusText }
    }
    if (response.status === 404) {
      return { ok: false, kind: 'not_found', message: response.statusText }
    }
    if (!response.ok) {
      return {
        ok: false,
        kind: 'unexpected',
        message: response.statusText,
        statusCode: response.status,
      }
    }

    const data = (await response.json()) as { content: { sha: string } }
    return { ok: true, newSha: data.content.sha }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return { ok: false, kind: 'network', message }
  }
}
