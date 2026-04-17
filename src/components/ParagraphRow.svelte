<script lang="ts">
  import { marked } from 'marked'
  import Marginalia from './Marginalia.svelte'
  import { readerState } from '../lib/reader/store.svelte'

  interface Props {
    paraId: string
    enText: string
    etText: string
    isTitle: boolean
    isDiverged: boolean
    baselineEtText?: string
    chapterSlug: string
  }
  let { paraId, enText, etText, isTitle, isDiverged, baselineEtText, chapterSlug }: Props = $props()

  let isFocused = $derived(readerState.focusedParagraph === paraId)

  function renderMd(text: string): string {
    const clean = text.replace(/<not-a-list\s*\/?>/g, '')
    return marked.parse(clean, { async: false }) as string
  }
</script>

<div
  class="paragraph-row"
  class:paragraph-title={isTitle}
  class:paragraph-focused={isFocused}
  id={paraId}
  aria-labelledby="{paraId}-en {paraId}-et"
>
  <div class="col-en" id="{paraId}-en">
    <span class="lang-label">EN</span>
    <!-- eslint-disable-next-line svelte/no-at-html-tags -- content from git repo, trusted -->
    {#if isTitle}<h2>{enText}</h2>{:else}<div class="prose">{@html renderMd(enText)}</div>{/if}
  </div>
  <div class="col-et" id="{paraId}-et">
    <span class="lang-label">ET</span>
    <!-- eslint-disable-next-line svelte/no-at-html-tags -- content from git repo, trusted -->
    {#if isTitle}<h2>{etText}</h2>{:else}<div class="prose">{@html renderMd(etText)}</div>{/if}
  </div>
  <div class="col-marginalia">
    {#if isDiverged && baselineEtText}
      <Marginalia baselineText={baselineEtText} {chapterSlug} />
    {/if}
  </div>
</div>

<style>
  .paragraph-row {
    display: flex;
    border-bottom: 1px solid #eae7e2;
    padding: 12px 20px;
  }
  .paragraph-title {
    padding: 16px 20px;
  }
  .col-en {
    position: relative;
    width: calc((100% - 140px) * 0.45);
    padding-right: 16px;
    border-right: 1px solid #e0ddd8;
  }
  .paragraph-focused > .col-en::after {
    content: '';
    position: absolute;
    top: 50%;
    right: -3px;
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: #c8c0b4;
    transform: translateY(-50%);
  }
  .col-et {
    width: calc((100% - 140px) * 0.55);
    padding-left: 16px;
  }
  .col-marginalia {
    width: 140px;
    padding-left: 12px;
  }
  .lang-label {
    display: none;
  }
  h2 {
    margin: 0;
    font-size: 1.2em;
  }
  .prose :global(p) {
    margin: 0;
  }
  .prose :global(p + p) {
    margin-top: 0.5em;
  }
  .prose :global(blockquote) {
    margin: 0.5em 0;
    padding-left: 1em;
    border-left: 2px solid #d0cdc8;
    color: #555;
    font-style: italic;
  }
  .prose :global(ol),
  .prose :global(ul) {
    margin: 0.5em 0;
    padding-left: 1.5em;
  }
  .prose :global(li) {
    margin-bottom: 0.25em;
  }
  .prose :global(table) {
    border-collapse: collapse;
    margin: 0.5em 0;
    font-size: 0.9em;
    width: 100%;
  }
  .prose :global(th),
  .prose :global(td) {
    border: 1px solid #e0ddd8;
    padding: 4px 8px;
    text-align: left;
    vertical-align: top;
  }
  .prose :global(th) {
    background: #f5f3ef;
    font-weight: 600;
  }
  .prose :global(strong) {
    font-weight: 600;
  }

  @media (max-width: 899px) {
    .paragraph-row {
      flex-direction: column;
      padding: 8px 12px;
    }
    .col-en,
    .col-et {
      width: 100%;
      padding: 0;
      border-right: none;
    }
    .col-et {
      margin-top: 8px;
      padding-left: 0;
    }
    .col-marginalia {
      width: 100%;
      padding-left: 0;
      margin-top: 8px;
    }
    .paragraph-focused {
      border-left: 3px solid #c8c0b4;
      padding-left: 9px;
    }
    .paragraph-focused > .col-en::after {
      display: none;
    }
    .lang-label {
      display: block;
      font-size: 9px;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #aaa;
      font-family: system-ui, sans-serif;
      margin-bottom: 4px;
    }
  }
</style>
