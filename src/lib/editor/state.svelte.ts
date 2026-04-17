export const editorState = $state({
  editingParaId: '',
  editingSlug: '',
  originalText: '',
  currentText: '',
  isDirty: false,
  isSaving: false,
  error: '',
  conflict: false,
})

export function startEdit(paraId: string, slug: string, text: string): void {
  editorState.editingParaId = paraId
  editorState.editingSlug = slug
  editorState.originalText = text
  editorState.currentText = text
  editorState.isDirty = false
  editorState.isSaving = false
  editorState.error = ''
  editorState.conflict = false
}

export function updateText(text: string): void {
  editorState.currentText = text
  editorState.isDirty = text !== editorState.originalText
}

export function cancelEdit(): void {
  resetEditor()
}

export function startSaving(): void {
  editorState.isSaving = true
  editorState.error = ''
}

export function commitSuccess(): void {
  resetEditor()
}

export function commitConflict(): void {
  editorState.isSaving = false
  editorState.conflict = true
}

export function commitError(message: string): void {
  editorState.isSaving = false
  editorState.error = message
}

export function resetEditor(): void {
  editorState.editingParaId = ''
  editorState.editingSlug = ''
  editorState.originalText = ''
  editorState.currentText = ''
  editorState.isDirty = false
  editorState.isSaving = false
  editorState.error = ''
  editorState.conflict = false
}
