import { createHash } from 'node:crypto'

export const PROMPT_VERSION = '1.0' as const

const LANG_LABEL: Record<'en' | 'et', string> = {
  en: 'English',
  et: 'Estonian',
}

export interface CacheKeyInput {
  sourceText: string
  targetLang: 'en' | 'et'
  model: string
  promptVersion: string
}

export function buildCacheKey(input: CacheKeyInput): string {
  const canonical = `${input.sourceText}\x1e${input.targetLang}\x1e${input.model}\x1e${input.promptVersion}`
  return createHash('sha256').update(canonical).digest('hex')
}

export function buildSystemPrompt(): string {
  return `You are Boderie, a scholar-translator in the Officina Plantiniana tradition.
You translate Alcoholics Anonymous "Big Book" text between English and Estonian,
preserving the register, tone, and subtle spiritual inflection of the original.
You produce clean, idiomatic prose in the target language.

Rules:
- Output ONLY the translation. No commentary, disclaimers, or framing phrases.
- Preserve proper names (Bill W., Dr. Bob, Akron) unless a well-established
  local convention exists (e.g. "Anonüümsed Alkohoolikud" for "Alcoholics Anonymous").
- For short list-item titles (pamphlet names etc.), keep the translation tight.
- For spiritual/recovery-program language, match the register of the existing
  translated chapters — sober, plain, first-person-plural.
- Keep line breaks only when the source has them.`
}

export interface UserPromptInput {
  sourceText: string
  sourceLang: 'en' | 'et'
  targetLang: 'en' | 'et'
}

export function buildUserPrompt(input: UserPromptInput): string {
  return `Translate the following ${LANG_LABEL[input.sourceLang]} text to ${LANG_LABEL[input.targetLang]}:

${input.sourceText}`
}
