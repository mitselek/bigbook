<script lang="ts">
  import type { ChapterManifest } from '../lib/content/manifest'

  interface Props {
    chapters: readonly ChapterManifest[]
    isOpen: boolean
    onSelect: (slug: string) => void
    onClose: () => void
  }
  let { chapters, isOpen, onSelect, onClose }: Props = $props()

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
    if (isOpen && dialogEl) dialogEl.focus()
  })

  function handleKeydown(e: KeyboardEvent) {
    const len = entries.length
    if (e.key === 'ArrowDown') {
      focusedIndex = (focusedIndex + 1) % len
    } else if (e.key === 'ArrowUp') {
      focusedIndex = (focusedIndex - 1 + len) % len
    } else if (e.key === 'Enter' && focusedIndex >= 0) {
      const entry = entries[focusedIndex]
      if (entry) {
        onSelect(entry.slug)
        onClose()
      }
    } else if (e.key === 'Escape') {
      onClose()
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

{#if isOpen}
  <div role="dialog" tabindex="-1" bind:this={dialogEl} onkeydown={handleKeydown}>
    <div
      class="toc-backdrop"
      role="presentation"
      onclick={onClose}
      onkeydown={(e) => {
        if (e.key === 'Escape') onClose()
      }}
    ></div>
    {#each groups as group}
      <div>
        <h3>{group.label}</h3>
        {#each group.items as ch}
          <button
            type="button"
            role="option"
            aria-selected="false"
            data-focused={entries.indexOf(ch) === focusedIndex ? 'true' : undefined}
            onclick={() => {
              onSelect(ch.slug)
              onClose()
            }}
          >
            <span>{stripHash(ch.title.en)}</span>
            <span>{stripHash(ch.title.et)}</span>
          </button>
        {/each}
      </div>
    {/each}
  </div>
{/if}
