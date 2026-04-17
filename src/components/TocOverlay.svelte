<script lang="ts">
  import { onMount } from 'svelte'
  import type { ChapterManifest } from '../lib/content/manifest'
  import { readerState } from '../lib/reader/store.svelte'

  interface Props {
    chapters: readonly ChapterManifest[]
    isOpen?: boolean
    onSelect?: (slug: string) => void
    onClose?: () => void
  }
  let { chapters, isOpen, onSelect, onClose }: Props = $props()

  let open = $derived(isOpen ?? readerState.tocOpen)

  function close() {
    readerState.tocOpen = false
    onClose?.()
  }

  function select(slug: string) {
    onSelect?.(slug)
    close()
    document.dispatchEvent(new CustomEvent('bigbook:force-load', { detail: { slug } }))
    const target = document.getElementById(`chapter-${slug}`)
    target?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const FRONT_MATTER = new Set(['cover', 'eessonad', 'arsti-arvamus'])
  const APPENDICES = new Set(['lisad', 'index'])

  function groupLabel(slug: string): 'Front matter' | 'Chapters' | 'Appendices' {
    if (FRONT_MATTER.has(slug)) return 'Front matter'
    if (APPENDICES.has(slug)) return 'Appendices'
    return 'Chapters'
  }

  function stripHash(title: string): string {
    return title.replace(/^#\s*/, '')
  }

  type Group = { label: 'Front matter' | 'Chapters' | 'Appendices'; items: ChapterManifest[] }

  const groups = $derived.by(() => {
    const map = new Map<string, Group>()
    for (const ch of chapters) {
      const label = groupLabel(ch.slug)
      let group = map.get(label)
      if (!group) {
        group = { label, items: [] }
        map.set(label, group)
      }
      group.items.push(ch)
    }
    const order: Array<'Front matter' | 'Chapters' | 'Appendices'> = [
      'Front matter',
      'Chapters',
      'Appendices',
    ]
    return order.map((l) => map.get(l)).filter((g): g is Group => g !== undefined)
  })

  const entries = $derived(groups.flatMap((g) => g.items))

  let focusedIndex = $state(-1)
  let dialogEl = $state<HTMLElement | null>(null)

  $effect(() => {
    if (open && dialogEl) dialogEl.focus()
  })

  onMount(() => {
    const onToggle = () => {
      readerState.tocOpen = !readerState.tocOpen
    }
    document.addEventListener('bigbook:toggle-toc', onToggle)
    return () => document.removeEventListener('bigbook:toggle-toc', onToggle)
  })

  function handleKeydown(e: KeyboardEvent) {
    const len = entries.length
    if (e.key === 'ArrowDown') {
      focusedIndex = (focusedIndex + 1) % len
    } else if (e.key === 'ArrowUp') {
      focusedIndex = (focusedIndex - 1 + len) % len
    } else if (e.key === 'Enter' && focusedIndex >= 0) {
      const entry = entries[focusedIndex]
      if (entry) select(entry.slug)
    } else if (e.key === 'Escape') {
      close()
    } else if (e.key === 'Tab' && dialogEl) {
      e.preventDefault()
      const focusable = Array.from(
        dialogEl.querySelectorAll<HTMLElement>('button,[tabindex]'),
      ).filter((el) => el !== dialogEl)
      if (focusable.length === 0) return
      const current = focusable.indexOf(document.activeElement as HTMLElement)
      const next = e.shiftKey
        ? (current - 1 + focusable.length) % focusable.length
        : (current + 1) % focusable.length
      focusable[next]?.focus()
    }
  }
</script>

{#if open}
  <div
    class="toc-overlay"
    role="dialog"
    tabindex="-1"
    bind:this={dialogEl}
    onkeydown={handleKeydown}
  >
    <div
      class="toc-backdrop"
      role="presentation"
      onclick={close}
      onkeydown={(e) => {
        if (e.key === 'Escape') close()
      }}
    ></div>
    <div class="toc-panel">
      {#each groups as group}
        <div class="toc-group">
          <h3>{group.label}</h3>
          {#each group.items as ch}
            <button
              type="button"
              role="option"
              aria-selected="false"
              data-focused={entries.indexOf(ch) === focusedIndex ? 'true' : undefined}
              onclick={() => select(ch.slug)}
            >
              <span class="toc-en">{stripHash(ch.title.en)}</span>
              <span class="toc-et">{stripHash(ch.title.et)}</span>
            </button>
          {/each}
        </div>
      {/each}
    </div>
  </div>
{/if}

<style>
  .toc-overlay {
    position: fixed;
    inset: 0;
    z-index: 20;
    display: flex;
    align-items: flex-start;
    justify-content: center;
  }
  .toc-backdrop {
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.4);
  }
  .toc-panel {
    position: relative;
    margin-top: 48px;
    background: #fff;
    border-radius: 8px;
    box-shadow: 0 4px 24px rgba(0, 0, 0, 0.15);
    max-width: 600px;
    width: 90%;
    max-height: 70vh;
    overflow-y: auto;
    padding: 16px 0;
    font-family: Georgia, 'Times New Roman', serif;
  }
  .toc-group {
    padding: 0 20px;
  }
  .toc-group h3 {
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 1px;
    color: #999;
    margin: 16px 0 8px;
    font-family: system-ui, sans-serif;
  }
  .toc-group h3:first-child {
    margin-top: 0;
  }
  button[role='option'] {
    display: block;
    width: 100%;
    text-align: left;
    padding: 8px 12px;
    border: none;
    background: none;
    cursor: pointer;
    border-radius: 4px;
    font: inherit;
    font-size: 14px;
    color: #333;
    line-height: 1.4;
  }
  button[role='option']:hover,
  button[role='option'][data-focused='true'] {
    background: #f5f3ef;
  }
  .toc-en {
    display: block;
  }
  .toc-et {
    display: block;
    color: #888;
    font-style: italic;
    font-size: 13px;
  }

  @media (max-width: 899px) {
    .toc-panel {
      margin-top: 44px;
      width: 100%;
      max-height: 80vh;
      border-radius: 0 0 8px 8px;
    }
  }
</style>
