<script lang="ts">
  import type { ChapterManifest } from '../lib/content/manifest'

  interface Props {
    chapters: readonly ChapterManifest[]
    isOpen: boolean
    onSelect: (slug: string) => void
    onClose: () => void
  }
  let {
    chapters: _chapters,
    isOpen: _isOpen,
    onSelect: _onSelect,
    onClose: _onClose,
  }: Props = $props()
</script>
