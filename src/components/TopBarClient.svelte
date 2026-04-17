<script lang="ts">
  import type { ChapterManifest } from '../lib/content/manifest'
  import { readerState } from '../lib/reader/store.svelte'

  interface Props {
    chapters: readonly ChapterManifest[]
  }
  let { chapters }: Props = $props()

  let titleEn = $derived(getTitle('en'))
  let titleEt = $derived(getTitle('et'))

  function getTitle(lang: 'en' | 'et'): string {
    const slug = readerState.currentChapter
    if (!slug) return ''
    const ch = chapters.find((c) => c.slug === slug)
    if (!ch) return ''
    return ch.title[lang].replace(/^#\s*/, '')
  }

  function toggleToc() {
    readerState.tocOpen = !readerState.tocOpen
  }
</script>

<button class="title-trigger" onclick={toggleToc} aria-label="Open table of contents">
  {#if titleEn}
    <span class="title-en">{titleEn}</span>
    <span class="title-sep">&middot;</span>
    <span class="title-et">{titleEt}</span>
  {/if}
</button>

<style>
  .title-trigger {
    background: none;
    border: none;
    cursor: pointer;
    font: inherit;
    color: inherit;
    padding: 0;
    display: inline;
    text-align: center;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    max-width: 100%;
  }
  .title-sep {
    margin: 0 6px;
    color: #ccc;
  }
  .title-en {
    color: #444;
  }
  .title-et {
    color: #888;
    font-style: italic;
  }
</style>
