const LAST_PARA_KEY = 'bigbook.lastParaId'

export function getLastParaId(): string | null {
  try {
    return localStorage.getItem(LAST_PARA_KEY)
  } catch {
    return null
  }
}

export function setLastParaId(paraId: string): void {
  try {
    localStorage.setItem(LAST_PARA_KEY, paraId)
  } catch {
    // silently ignore storage errors (private mode, quota exceeded)
  }
}
