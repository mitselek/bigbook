<script lang="ts">
  interface Props {
    baselineText: string
    chapterSlug: string
  }
  let { baselineText, chapterSlug: _chapterSlug }: Props = $props()
</script>

<div>
  <span>originaal</span>
  <span>{baselineText}</span>
</div>
