import Anthropic from '@anthropic-ai/sdk'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { translate } from './boderie'
import { buildManifest } from './emit-manifest'
import { renderSection } from './emit-markdown'
import { renderWrapper } from './emit-wrapper'
import { groupForSlug } from './groups'
import { readManualTranslations, seedCacheFromManual } from './seeder'
import { COVER_MARKER, renderCover, renderIndex, shouldRegenerateCover } from './static-templates'
import type { ExtractionSection } from '../pair-en-et/types'
import type {
  BlockKind,
  BoderieCache,
  Extraction,
  ExtractionBlock,
  Group,
  PairingArtifact,
  RenderedBlock,
  SectionRenderPlan,
  UnpairedBlock,
} from './types'

export interface BuildRenderPlansInput {
  artifact: PairingArtifact
  en: Extraction
  et: Extraction
  cache: BoderieCache
  client: Parameters<typeof translate>[1]['client']
}

type BlockMap = Map<string, ExtractionBlock>

const KIND_PREFIX: Record<BlockKind, string> = {
  paragraph: 'p',
  heading: 'h',
  'list-item': 'l',
  blockquote: 'q',
  verse: 'v',
  table: 't',
  byline: 'b',
  footnote: 'f',
}

function indexBlocks(ext: Extraction): BlockMap {
  const m: BlockMap = new Map()
  for (const s of ext.sections) for (const b of s.blocks) m.set(b.id, b)
  return m
}

function firstText(ids: string | string[], blocks: BlockMap): string {
  const arr = Array.isArray(ids) ? ids : [ids]
  return arr
    .map((id) => blocks.get(id)?.text ?? '')
    .filter((t) => t.length > 0)
    .join('\n\n')
}

function groupForSlugOrThrow(slug: string): Group {
  const g = groupForSlug(slug)
  if (g === null) throw new Error(`no group for canonical slug ${slug}`)
  return g
}

function synthesizeParaId(slug: string, u: UnpairedBlock): string {
  const prefix = KIND_PREFIX[u.kind]
  const tail = u.blockId.match(/\d+$/)
  if (tail === null) throw new Error(`cannot synthesize paraId for ${u.blockId}`)
  return `${slug}-${prefix}${tail[0]}`
}

export async function buildRenderPlans(input: BuildRenderPlansInput): Promise<SectionRenderPlan[]> {
  const enBlocks = indexBlocks(input.en)
  const etBlocks = indexBlocks(input.et)

  const plans: SectionRenderPlan[] = []
  for (const section of input.artifact.sections) {
    const enSection = input.en.sections.find((s: ExtractionSection) => s.id === section.enSectionId)
    const etSection = input.et.sections.find((s: ExtractionSection) => s.id === section.etSectionId)
    if (enSection === undefined || etSection === undefined) {
      throw new Error(`section not found in extraction for ${section.canonicalSlug}`)
    }

    const enRendered: RenderedBlock[] = []
    const etRendered: RenderedBlock[] = []

    for (const pair of section.pairs) {
      const enText = firstText(pair.enBlockId, enBlocks)
      const etText = firstText(pair.etBlockId, etBlocks)
      enRendered.push({
        paraId: pair.paraId,
        kind: pair.kind,
        text: enText,
        isAutoTranslated: false,
      })
      etRendered.push({
        paraId: pair.paraId,
        kind: pair.kind,
        text: etText,
        isAutoTranslated: false,
      })
    }

    for (const u of section.unpaired) {
      if (u.reason === 'structural-extra' || u.reason === 'needs-review') continue
      const synthesized = synthesizeParaId(section.canonicalSlug, u)
      if (u.side === 'en') {
        const enBlock = enBlocks.get(u.blockId)
        if (enBlock === undefined) throw new Error(`EN block ${u.blockId} missing from extraction`)
        const { translation } = await translate(
          { sourceText: enBlock.text, sourceLang: 'en', targetLang: 'et' },
          { cache: input.cache, client: input.client },
        )
        enRendered.push({
          paraId: synthesized,
          kind: u.kind,
          text: enBlock.text,
          isAutoTranslated: false,
        })
        etRendered.push({
          paraId: synthesized,
          kind: u.kind,
          text: translation,
          isAutoTranslated: true,
        })
      } else {
        const etBlock = etBlocks.get(u.blockId)
        if (etBlock === undefined) throw new Error(`ET block ${u.blockId} missing from extraction`)
        const { translation } = await translate(
          { sourceText: etBlock.text, sourceLang: 'et', targetLang: 'en' },
          { cache: input.cache, client: input.client },
        )
        enRendered.push({
          paraId: synthesized,
          kind: u.kind,
          text: translation,
          isAutoTranslated: true,
        })
        etRendered.push({
          paraId: synthesized,
          kind: u.kind,
          text: etBlock.text,
          isAutoTranslated: false,
        })
      }
    }

    plans.push({
      canonicalSlug: section.canonicalSlug,
      group: groupForSlugOrThrow(section.canonicalSlug),
      title: { en: enSection.title, et: etSection.title },
      pdfPageStart: enSection.pdfPageStart,
      pdfPageEnd: enSection.pdfPageEnd,
      en: enRendered,
      et: etRendered,
    })
  }

  for (const us of input.artifact.unpairedSections) {
    const g = groupForSlug(us.canonicalSlug)
    if (g === null) continue
    const sourceExt = us.side === 'en' ? input.en : input.et
    const section = sourceExt.sections.find((s: ExtractionSection) => s.id === us.sectionId)
    if (section === undefined) throw new Error(`section ${us.sectionId} missing from extraction`)

    const enRendered: RenderedBlock[] = []
    const etRendered: RenderedBlock[] = []
    const kindOrdinals: Partial<Record<BlockKind, number>> = {}

    for (const b of section.blocks as ExtractionBlock[]) {
      const prefix = KIND_PREFIX[b.kind]
      const n = (kindOrdinals[b.kind] ?? 0) + 1
      kindOrdinals[b.kind] = n
      const paraId = `${us.canonicalSlug}-${prefix}${String(n).padStart(3, '0')}`
      const { translation } = await translate(
        { sourceText: b.text, sourceLang: us.side, targetLang: us.side === 'en' ? 'et' : 'en' },
        { cache: input.cache, client: input.client },
      )
      if (us.side === 'en') {
        enRendered.push({ paraId, kind: b.kind, text: b.text, isAutoTranslated: false })
        etRendered.push({ paraId, kind: b.kind, text: translation, isAutoTranslated: true })
      } else {
        enRendered.push({ paraId, kind: b.kind, text: translation, isAutoTranslated: true })
        etRendered.push({ paraId, kind: b.kind, text: b.text, isAutoTranslated: false })
      }
    }

    plans.push({
      canonicalSlug: us.canonicalSlug,
      group: g,
      title: { en: section.title, et: section.title },
      pdfPageStart: section.pdfPageStart,
      pdfPageEnd: section.pdfPageEnd,
      en: enRendered,
      et: etRendered,
    })
  }

  return plans
}

function ensureDir(path: string): void {
  mkdirSync(dirname(path), { recursive: true })
}

async function run(argv: string[]): Promise<void> {
  const mode = argv[0] ?? 'full'
  const scriptDir = dirname(fileURLToPath(import.meta.url))
  const repoRoot = resolve(scriptDir, '..', '..')

  const artifactPath = resolve(repoRoot, 'data/extractions/pairing/en-et.json')
  const enPath = resolve(repoRoot, 'data/extractions/structured/en-4th-edition.json')
  const etPath = resolve(repoRoot, 'data/extractions/structured-et/et-4th-edition.json')
  const cachePath = resolve(repoRoot, 'data/extractions/pairing/translation-cache.json')
  const manualPath = resolve(repoRoot, 'data/extractions/pairing/manual-translations.json')

  const artifact: PairingArtifact = JSON.parse(
    readFileSync(artifactPath, 'utf8'),
  ) as PairingArtifact
  const en: Extraction = JSON.parse(readFileSync(enPath, 'utf8')) as Extraction
  const et: Extraction = JSON.parse(readFileSync(etPath, 'utf8')) as Extraction
  const cache: BoderieCache = existsSync(cachePath)
    ? (JSON.parse(readFileSync(cachePath, 'utf8')) as BoderieCache)
    : {}

  // Pre-seed from manual translations (if present)
  if (existsSync(manualPath)) {
    const manual = readManualTranslations(manualPath)
    const seedResult = seedCacheFromManual(cache, manual)
    console.log(
      `Seeded ${seedResult.seeded} cache entries from manual-translations.json (${seedResult.skipped} skipped)`,
    )
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  const client =
    apiKey !== undefined && apiKey !== ''
      ? new Anthropic({ apiKey })
      : ({
          messages: {
            create: async () => {
              throw new Error('ANTHROPIC_API_KEY not set and cache miss on required translation')
            },
          },
        } as unknown as InstanceType<typeof Anthropic>)

  const plans = await buildRenderPlans({ artifact, en, et, cache, client })
  writeFileSync(cachePath, JSON.stringify(cache, null, 2) + '\n')

  if (mode === 'translate-only') {
    console.log(`Translations cached: ${Object.keys(cache).length}`)
    return
  }
  if (mode === 'emit-only' || mode === 'full') {
    await emit(plans, repoRoot)
    console.log(
      `Bootstrapped ${plans.length} sections. Cache: ${Object.keys(cache).length} entries.`,
    )
  }
}

async function emit(plans: SectionRenderPlan[], repoRoot: string): Promise<void> {
  const manifest = buildManifest(plans, new Date().toISOString())
  const manifestPath = resolve(repoRoot, 'src/content/manifest.json')
  ensureDir(manifestPath)
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n')

  const wrapperPath = resolve(repoRoot, 'src/lib/content/manifest.ts')
  ensureDir(wrapperPath)
  writeFileSync(wrapperPath, renderWrapper())

  for (const plan of plans) {
    for (const lang of ['en', 'et'] as const) {
      const path = resolve(repoRoot, `src/content/${lang}/${plan.canonicalSlug}.md`)
      ensureDir(path)
      writeFileSync(path, renderSection(plan, lang))
    }
  }

  for (const lang of ['en', 'et'] as const) {
    const path = resolve(repoRoot, `src/content/${lang}/cover.md`)
    ensureDir(path)
    const existing = existsSync(path) ? readFileSync(path, 'utf8') : null
    if (shouldRegenerateCover(existing)) writeFileSync(path, renderCover(lang))
  }

  for (const lang of ['en', 'et'] as const) {
    const path = resolve(repoRoot, `src/content/${lang}/index.md`)
    ensureDir(path)
    writeFileSync(path, renderIndex(manifest, lang))
  }
}

const isMainModule =
  typeof process !== 'undefined' &&
  process.argv[1] !== undefined &&
  fileURLToPath(import.meta.url) === resolve(process.argv[1])

if (isMainModule) {
  run(process.argv.slice(2)).catch((err) => {
    console.error(err)
    process.exit(1)
  })
}

void COVER_MARKER
