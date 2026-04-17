<script lang="ts">
  import { onMount, tick } from 'svelte'
  import ParagraphRow from './ParagraphRow.svelte'
  import EditableRow from './EditableRow.svelte'
  import { commitParagraphEdit } from '../lib/editor/commit'
  import { replaceParaText } from '../lib/content/serialize'
  import {
    startSaving,
    commitSuccess,
    commitConflict,
    commitError,
  } from '../lib/editor/state.svelte'
  import {
    fetchEn,
    fetchBaselineEt,
    fetchCurrentEtFromMain,
    fetchCurrentEt,
    type CurrentEtResult,
  } from '../lib/content/fetch'
  import { getAccessToken } from '../lib/auth/token-store'
  import { parse } from '../lib/content/parse'
  import { diffCurrentVsBaseline } from '../lib/content/diff'
  import { readerState } from '../lib/reader/store.svelte'
  import { createPreloadObserver, createFocusObserver } from '../lib/reader/scroll-anchor'
  import { setLastParaId } from '../lib/reader/local-state'
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

    const onForceLoad = (e: Event) => {
      const detail = (e as CustomEvent<{ slug: string }>).detail
      if (detail.slug === slug && status === 'skeleton') {
        load()
      }
    }
    document.addEventListener('bigbook:force-load', onForceLoad)

    return () => {
      observer.disconnect()
      document.removeEventListener('bigbook:refresh-chapters', onRefresh)
      document.removeEventListener('bigbook:force-load', onForceLoad)
    }
  })

  async function load(): Promise<void> {
    status = 'loading'
    readerState.chapterStates.set(slug, { status: 'loading' })

    const token = readerState.isAuthenticated ? (getAccessToken() ?? undefined) : undefined
    const [enResult, baselineResult, currentResult] = await Promise.all([
      fetchEn(slug),
      fetchBaselineEt(slug),
      token !== undefined ? fetchCurrentEt(slug, { token }) : fetchCurrentEtFromMain(slug),
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

    try {
      let currentEtContent: string
      let currentSha = ''
      let currentEtag = ''

      if (token !== undefined && currentResult.ok) {
        const val = currentResult.value as CurrentEtResult
        if (val.status === 'fetched') {
          currentEtContent = val.content
          currentSha = val.sha
          currentEtag = val.etag
        } else {
          currentEtContent = ''
        }
      } else if (currentResult.ok) {
        currentEtContent = currentResult.value as string
      } else {
        return
      }

      const enParsed = parse(enResult.value)
      const baselineParsed = parse(baselineResult.value)
      const currentParsed = parse(currentEtContent)
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
        currentEt: currentEtContent,
        sha: currentSha,
        etag: currentEtag,
      })
    } catch (err) {
      status = 'error'
      errorMessage = err instanceof Error ? err.message : String(err)
      readerState.chapterStates.set(slug, { status: 'error', message: errorMessage })
    }
  }

  let focusObserver: ReturnType<typeof createFocusObserver> | undefined

  $effect(() => {
    if (status === 'loaded' && sectionEl) {
      tick().then(() => {
        focusObserver?.disconnect()
        focusObserver = createFocusObserver((paraId) => {
          readerState.focusedParagraph = paraId
          setLastParaId(paraId)
        })
        sectionEl?.querySelectorAll<HTMLElement>('.paragraph-row').forEach((el) => {
          if (el.id) focusObserver?.observe(el, el.id)
        })
      })
    }
    return () => {
      focusObserver?.disconnect()
      focusObserver = undefined
    }
  })

  function retry() {
    status = 'skeleton'
    // Re-trigger on next tick
    setTimeout(() => load(), 0)
  }

  async function handleSave(paraId: string, newText: string): Promise<void> {
    const state = readerState.chapterStates.get(slug)
    if (state?.status !== 'loaded') return

    const token = getAccessToken()
    if (!token) {
      commitError('Palun logi uuesti sisse')
      return
    }

    startSaving()

    const result = await commitParagraphEdit({
      slug,
      paraId,
      newText,
      currentContent: state.currentEt,
      sha: state.sha,
      token,
    })

    if (result.ok) {
      const newContent = replaceParaText(state.currentEt, paraId, newText)
      readerState.chapterStates.set(slug, {
        ...state,
        currentEt: newContent,
        sha: result.newSha,
      })
      const idx = paragraphs.findIndex((p) => p.paraId === paraId)
      if (idx >= 0) {
        paragraphs[idx] = { ...paragraphs[idx], etText: newText }
      }
      commitSuccess()
    } else if (result.kind === 'conflict') {
      commitConflict()
    } else if (result.kind === 'auth_expired') {
      commitError('Palun logi uuesti sisse')
    } else if (result.kind === 'network') {
      commitError('Võrguühendus puudub. Sinu muudatused on alles.')
    } else {
      commitError(`Viga: ${result.message}`)
    }
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
      {#if readerState.isAuthenticated}
        <EditableRow
          paraId={p.paraId}
          enText={p.enText}
          etText={p.etText}
          isTitle={p.isTitle}
          isDiverged={p.isDiverged}
          baselineEtText={p.baselineEtText}
          chapterSlug={slug}
          onSave={handleSave}
        />
      {:else}
        <ParagraphRow
          paraId={p.paraId}
          enText={p.enText}
          etText={p.etText}
          isTitle={p.isTitle}
          isDiverged={p.isDiverged}
          baselineEtText={p.baselineEtText}
          chapterSlug={slug}
        />
      {/if}
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
