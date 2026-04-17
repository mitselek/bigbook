<script lang="ts">
  import Marginalia from './Marginalia.svelte'

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
</script>

<div id={paraId} aria-labelledby="{paraId}-en {paraId}-et">
  <div id="{paraId}-en">
    {#if isTitle}<h2>{enText}</h2>{:else}<p>{enText}</p>{/if}
  </div>
  <div id="{paraId}-et">
    {#if isTitle}<h2>{etText}</h2>{:else}<p>{etText}</p>{/if}
  </div>
  {#if isDiverged && baselineEtText}
    <Marginalia baselineText={baselineEtText} {chapterSlug} />
  {/if}
</div>
