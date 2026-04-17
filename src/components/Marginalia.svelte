<script lang="ts">
  interface Props {
    baselineText: string
    chapterSlug: string
  }
  let { baselineText, chapterSlug }: Props = $props()

  let expanded = $state(false)
  let commitMeta: { name: string; date: string } | null = $state(null)

  async function fetchCommitMeta(): Promise<{ name: string; date: string } | null> {
    const url = `https://api.github.com/repos/mitselek/bigbook/commits?path=src/content/et/${chapterSlug}.md&per_page=1`
    const res = await fetch(url)
    if (!res.ok) return null
    const data = (await res.json()) as Array<{
      commit: { author: { name: string; date: string } }
    }>
    const first = data[0]
    return first ? { name: first.commit.author.name, date: first.commit.author.date } : null
  }

  async function toggle() {
    expanded = !expanded
    if (expanded && commitMeta === null) {
      commitMeta = await fetchCommitMeta()
    }
  }
</script>

<div
  class="marginalia"
  role="button"
  tabindex="0"
  onclick={toggle}
  onkeydown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') toggle()
  }}
>
  <span class="label">originaal</span>
  <span class="baseline-text">{baselineText}</span>
  {#if expanded && commitMeta}
    <span class="meta">{commitMeta.name}</span>
    <span class="meta">{commitMeta.date}</span>
  {/if}
</div>

<style>
  .marginalia {
    font-size: 11px;
    color: #888;
    cursor: pointer;
  }
  .label {
    display: block;
    font-size: 9px;
    text-transform: uppercase;
    letter-spacing: 1px;
    color: #b08050;
    margin-bottom: 4px;
  }
  .baseline-text {
    display: block;
    line-height: 1.4;
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
  }
  .meta {
    display: block;
    font-size: 10px;
    color: #aaa;
    margin-top: 4px;
  }

  @media (max-width: 899px) {
    .marginalia {
      background: #faf5ee;
      border-left: 3px solid #d4a574;
      margin: 0 12px 8px;
      padding: 8px 12px;
      border-radius: 2px;
    }
  }
</style>
