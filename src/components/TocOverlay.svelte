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
</script>

{#if isOpen}
  <div role="dialog">
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
