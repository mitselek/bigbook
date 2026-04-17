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
  let { paraId, enText, etText, isTitle: _isTitle, isDiverged: _isDiverged, baselineEtText: _baselineEtText, chapterSlug: _chapterSlug }: Props =
    $props()
</script>

<div id={paraId}>
  <div>{enText}</div>
  <div>{etText}</div>
</div>
