<script lang="ts">
  import { onMount } from 'svelte'
  import ParagraphRow from './ParagraphRow.svelte'
  import { fetchEn, fetchBaselineEt, fetchCurrentEt } from '../lib/content/fetch'
  import { parse } from '../lib/content/parse'
  import { diffCurrentVsBaseline } from '../lib/content/diff'
  import { readerState } from '../lib/reader/store.svelte'
  import { createPreloadObserver } from '../lib/reader/scroll-anchor'
  import { ESTIMATED_HEIGHT_TITLE, ESTIMATED_HEIGHT_BODY } from '../lib/content/manifest'

  interface Props {
    slug: string
    paraIds: readonly string[]
    titleEn: string
    titleEt: string
  }
  let { slug, paraIds, titleEn, titleEt }: Props = $props()

  type ParagraphData = {
    paraId: string
    enText: string
    etText: string
    isTitle: boolean
    isDiverged: boolean
    baselineEtText?: string
  }

  let status: 'skeleton' | 'loading' | 'loaded' | 'error' = $state('skeleton')
  let errorMessage: string = $state('')
  let paragraphs: ParagraphData[] = $state([])
  let sectionEl: HTMLElement | undefined = $state(undefined)

  onMount(() => {
    if (!sectionEl) return
    const observer = createPreloadObserver((observedSlug, isVisible) => {
      if (observedSlug === slug && isVisible && status === 'skeleton') {
        load()
      }
    })
    observer.observe(sectionEl, slug)

    const onRefresh = () => {
      if (status === 'loaded') {
        status = 'skeleton'
        load()
      }
    }
    document.addEventListener('bigbook:refresh-chapters', onRefresh)

    return () => {
      observer.disconnect()
      document.removeEventListener('bigbook:refresh-chapters', onRefresh)
    }
  })

  async function load(): Promise<void> {
    status = 'loading'
    readerState.chapterStates.set(slug, { status: 'loading' })

    const [enResult, baselineResult, currentResult] = await Promise.all([
      fetchEn(slug),
      fetchBaselineEt(slug),
      fetchCurrentEt(slug),
    ])

    if (!enResult.ok) {
      status = 'error'
      errorMessage = `EN fetch failed: ${enResult.error.message}`
      readerState.chapterStates.set(slug, { status: 'error', message: errorMessage })
      return
    }
    if (!baselineResult.ok) {
      status = 'error'
      errorMessage = `Baseline ET fetch failed: ${baselineResult.error.message}`
      readerState.chapterStates.set(slug, { status: 'error', message: errorMessage })
      return
    }
    if (!currentResult.ok) {
      status = 'error'
      errorMessage = `Current ET fetch failed: ${currentResult.error.message}`
      readerState.chapterStates.set(slug, { status: 'error', message: errorMessage })
      return
    }

    const currentEtValue = currentResult.value
    if (currentEtValue.status !== 'fetched') {
      status = 'error'
      errorMessage = 'Unexpected 304 on first fetch'
      readerState.chapterStates.set(slug, { status: 'error', message: errorMessage })
      return
    }

    try {
      const enParsed = parse(enResult.value)
      const baselineParsed = parse(baselineResult.value)
      const currentParsed = parse(currentEtValue.content)
      const diverged = diffCurrentVsBaseline(currentParsed, baselineParsed)

      paragraphs = paraIds.map((paraId) => {
        const isTitle = paraId.endsWith('-title')
        const enText = isTitle
          ? titleEn.replace(/^#\s*/, '')
          : (enParsed.paragraphs.get(paraId) ?? '')
        const etText = isTitle
          ? titleEt.replace(/^#\s*/, '')
          : (currentParsed.paragraphs.get(paraId) ?? '')
        const isDiverged = diverged.has(paraId)
        const baselineEtText = isDiverged
          ? (baselineParsed.paragraphs.get(paraId) ?? '')
          : undefined

        return { paraId, enText, etText, isTitle, isDiverged, baselineEtText }
      })

      status = 'loaded'
      readerState.chapterStates.set(slug, {
        status: 'loaded',
        en: enResult.value,
        baselineEt: baselineResult.value,
        currentEt: currentEtValue.content,
        sha: currentEtValue.sha,
        etag: currentEtValue.etag,
      })
    } catch (err) {
      status = 'error'
      errorMessage = err instanceof Error ? err.message : String(err)
      readerState.chapterStates.set(slug, { status: 'error', message: errorMessage })
    }
  }

  function retry() {
    status = 'skeleton'
    // Re-trigger on next tick
    setTimeout(() => load(), 0)
  }
</script>

<section bind:this={sectionEl} class="chapter-section" id="chapter-{slug}" data-chapter-slug={slug}>
  {#if status === 'skeleton' || status === 'loading'}
    {#each paraIds as paraId}
      <div
        class="skeleton-row {paraId.endsWith('-title') ? 'skeleton-title' : 'skeleton-body'}"
        id={paraId}
        style="min-height: {paraId.endsWith('-title')
          ? ESTIMATED_HEIGHT_TITLE
          : ESTIMATED_HEIGHT_BODY}px"
      >
        <div class="skeleton-en"></div>
        <div class="skeleton-et"></div>
        <div class="skeleton-marginalia"></div>
      </div>
    {/each}
    {#if status === 'loading'}
      <div class="loading-indicator">Loading...</div>
    {/if}
  {:else if status === 'error'}
    <div class="error-row">
      <p>{errorMessage}</p>
      <button onclick={retry}>Retry</button>
    </div>
  {:else}
    {#each paragraphs as p}
      <ParagraphRow
        paraId={p.paraId}
        enText={p.enText}
        etText={p.etText}
        isTitle={p.isTitle}
        isDiverged={p.isDiverged}
        baselineEtText={p.baselineEtText}
        chapterSlug={slug}
      />
    {/each}
  {/if}
</section>

<style>
  .chapter-section {
    scroll-margin-top: 44px;
  }
  .skeleton-row {
    display: flex;
    border-bottom: 1px solid #eae7e2;
    padding: 12px 20px;
  }
  .skeleton-title {
    padding: 16px 20px;
  }
  .skeleton-en {
    width: calc((100% - 140px) * 0.45);
    padding-right: 16px;
    border-right: 1px solid #e0ddd8;
  }
  .skeleton-et {
    width: calc((100% - 140px) * 0.55);
    padding-left: 16px;
  }
  .skeleton-marginalia {
    width: 140px;
    padding-left: 12px;
  }
  .loading-indicator {
    text-align: center;
    padding: 12px;
    color: #888;
    font-size: 13px;
  }
  .error-row {
    padding: 20px;
    text-align: center;
    color: #c00;
    font-size: 13px;
  }
  .error-row button {
    margin-top: 8px;
    padding: 4px 12px;
    border: 1px solid #ccc;
    border-radius: 4px;
    background: #fff;
    cursor: pointer;
  }
</style>
