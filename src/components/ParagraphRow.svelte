<script lang="ts">
  interface Props {
    paraId: string
    enText: string
    etText: string
    isTitle: boolean
    isDiverged: boolean
    baselineEtText?: string
    chapterSlug: string
  }
  let {
    paraId,
    enText,
    etText,
    isTitle,
    isDiverged: _isDiverged,
    baselineEtText: _baselineEtText,
    chapterSlug: _chapterSlug,
  }: Props = $props()
</script>

<div id={paraId}>
  <div>
    {#if isTitle}<h2>{enText}</h2>{:else}<p>{enText}</p>{/if}
  </div>
  <div>
    {#if isTitle}<h2>{etText}</h2>{:else}<p>{etText}</p>{/if}
  </div>
</div>
