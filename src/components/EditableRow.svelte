<script lang="ts">
  import ParagraphRow from './ParagraphRow.svelte'
  import { editorState, startEdit, updateText, cancelEdit } from '../lib/editor/state.svelte'

  interface Props {
    paraId: string
    enText: string
    etText: string
    isTitle: boolean
    isDiverged: boolean
    baselineEtText?: string
    chapterSlug: string
    onSave?: (paraId: string, newText: string) => void
  }
  let { paraId, enText, etText, isTitle, isDiverged, baselineEtText, chapterSlug, onSave }: Props =
    $props()

  let isEditing = $derived(editorState.editingParaId === paraId)
  let isOtherEditing = $derived(
    editorState.editingParaId !== '' && editorState.editingParaId !== paraId,
  )
  let isLocked = $derived(isOtherEditing && editorState.isDirty)

  function handleEdit() {
    if (editorState.editingParaId !== '' && !editorState.isDirty) {
      cancelEdit()
    }
    startEdit(paraId, chapterSlug, etText)
  }

  function handleInput(e: Event) {
    const target = e.target as HTMLTextAreaElement
    updateText(target.value)
  }

  function handleCancel() {
    cancelEdit()
  }

  function handleSave() {
    onSave?.(paraId, editorState.currentText)
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape' && !editorState.isDirty) {
      cancelEdit()
    }
  }
</script>

<div class="editable-wrapper" class:editable-locked={isLocked}>
  {#if isEditing}
    <div class="edit-row">
      <div class="col-en-ref">
        <span class="lang-label-ref">EN</span>
        {#if isTitle}<h2>{enText}</h2>{:else}<p>{enText}</p>{/if}
      </div>
      <div class="col-et-edit">
        {#if editorState.conflict}
          <div class="conflict-banner">
            ⚠ Seda lõiku on vahepeal muudetud. Sinu muudatused on alles — kopeeri tekst ja laadi
            leht uuesti.
          </div>
        {/if}
        {#if editorState.error}
          <div class="error-banner">{editorState.error}</div>
        {/if}
        <textarea
          value={editorState.currentText}
          oninput={handleInput}
          onkeydown={handleKeydown}
          readonly={editorState.conflict}
          class:conflict-textarea={editorState.conflict}
          disabled={editorState.isSaving}
        ></textarea>
        {#if editorState.isDirty && !editorState.conflict}
          <div class="edit-buttons">
            <button
              type="button"
              class="btn-cancel"
              onclick={handleCancel}
              disabled={editorState.isSaving}>Tühista</button
            >
            <button
              type="button"
              class="btn-save"
              onclick={handleSave}
              disabled={editorState.isSaving}
            >
              {editorState.isSaving ? 'Salvestamine...' : 'Salvesta'}
            </button>
          </div>
        {/if}
        {#if editorState.conflict}
          <div class="edit-buttons">
            <button type="button" class="btn-cancel" onclick={handleCancel}>Sulge</button>
            <button
              type="button"
              class="btn-save"
              onclick={() => {
                navigator.clipboard.writeText(editorState.currentText)
                window.location.reload()
              }}>Kopeeri ja laadi uuesti</button
            >
          </div>
        {/if}
      </div>
    </div>
  {:else}
    <div class="read-row" class:dimmed={isLocked}>
      <ParagraphRow
        {paraId}
        {enText}
        {etText}
        {isTitle}
        {isDiverged}
        {baselineEtText}
        {chapterSlug}
      />
      {#if !isTitle && !isLocked}
        <button type="button" class="pencil-btn" title="Muuda seda lõiku" onclick={handleEdit}
          >✎</button
        >
      {/if}
    </div>
  {/if}
</div>

<style>
  .editable-wrapper {
    position: relative;
  }
  .dimmed {
    opacity: 0.4;
    pointer-events: none;
  }
  .read-row {
    position: relative;
  }
  .pencil-btn {
    position: absolute;
    top: 12px;
    right: 152px;
    width: 24px;
    height: 24px;
    border-radius: 4px;
    background: #f0ede8;
    border: none;
    cursor: pointer;
    color: #8b7355;
    font-size: 14px;
    display: none;
    align-items: center;
    justify-content: center;
  }
  .read-row:hover .pencil-btn {
    display: flex;
  }
  .edit-row {
    display: flex;
    border-bottom: 1px solid #eae7e2;
    padding: 12px 20px;
    background: #fffdf8;
    border-left: 3px solid #8b7355;
  }
  .col-en-ref {
    width: calc((100% - 140px) * 0.45);
    padding-right: 16px;
    border-right: 1px solid #e0ddd8;
    font-family: Georgia, 'Times New Roman', serif;
    color: #555;
  }
  .col-et-edit {
    width: calc((100% - 140px) * 0.55 + 140px);
    padding-left: 16px;
  }
  .lang-label-ref {
    display: none;
  }
  h2 {
    margin: 0;
    font-size: 1.2em;
  }
  p {
    margin: 0;
  }
  textarea {
    width: 100%;
    min-height: 100px;
    font-family: Georgia, 'Times New Roman', serif;
    font-size: inherit;
    border: 2px solid #8b7355;
    border-radius: 4px;
    padding: 8px;
    resize: vertical;
    background: white;
    color: #333;
  }
  .conflict-textarea {
    border-color: #c00;
    background: #fffafa;
  }
  .conflict-banner,
  .error-banner {
    padding: 8px 12px;
    background: #fef0f0;
    border: 1px solid #f0c0c0;
    border-radius: 4px;
    font-family: system-ui, sans-serif;
    font-size: 12px;
    color: #a00;
    margin-bottom: 8px;
  }
  .edit-buttons {
    margin-top: 8px;
    display: flex;
    gap: 8px;
    justify-content: flex-end;
  }
  .btn-cancel {
    padding: 6px 16px;
    border: 1px solid #ccc;
    border-radius: 4px;
    background: white;
    color: #666;
    cursor: pointer;
    font: inherit;
    font-size: 12px;
  }
  .btn-save {
    padding: 6px 16px;
    border: none;
    border-radius: 4px;
    background: #8b7355;
    color: white;
    cursor: pointer;
    font: inherit;
    font-size: 12px;
  }
  .btn-save:disabled,
  .btn-cancel:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  @media (max-width: 899px) {
    .pencil-btn {
      right: 12px;
      display: flex;
    }
    .edit-row {
      flex-direction: column;
      padding: 8px 12px;
    }
    .col-en-ref,
    .col-et-edit {
      width: 100%;
      padding: 0;
      border-right: none;
    }
    .col-et-edit {
      margin-top: 8px;
      padding-left: 0;
    }
    .edit-buttons {
      flex-direction: column;
    }
    .btn-cancel,
    .btn-save {
      width: 100%;
    }
  }
</style>
