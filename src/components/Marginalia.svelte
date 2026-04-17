<script lang="ts">
  interface Props {
    baselineText: string
    chapterSlug: string
  }
  let { baselineText, chapterSlug }: Props = $props()

  let expanded = $state(false)
  let commitMeta: { name: string; date: string } | null = $state(null)

  async function toggle() {
    expanded = !expanded
    if (expanded && commitMeta === null) {
      const url = `https://api.github.com/repos/mitselek/bigbook/commits?path=src/content/et/${chapterSlug}.md&per_page=1`
      const res = await fetch(url)
      if (res.ok) {
        const data = (await res.json()) as Array<{
          commit: { author: { name: string; date: string } }
        }>
        const first = data[0]
        if (first) {
          commitMeta = { name: first.commit.author.name, date: first.commit.author.date }
        }
      }
    }
  }
</script>

<div
  role="button"
  tabindex="0"
  onclick={toggle}
  onkeydown={(e) => (e.key === 'Enter' || e.key === ' ' ? toggle() : undefined)}
>
  <span>originaal</span>
  <span>{baselineText}</span>
  {#if expanded && commitMeta}
    <span>{commitMeta.name}</span>
    <span>{commitMeta.date}</span>
  {/if}
</div>
