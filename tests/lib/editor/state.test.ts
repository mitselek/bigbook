import { describe, it, expect, beforeEach } from 'vitest'
import {
  editorState,
  startEdit,
  updateText,
  cancelEdit,
  startSaving,
  commitSuccess,
  commitConflict,
  commitError,
  resetEditor,
} from '../../../src/lib/editor/state.svelte'

describe('editorState', () => {
  beforeEach(() => {
    resetEditor()
  })

  it('starts in idle state', () => {
    expect(editorState.editingParaId).toBe('')
    expect(editorState.editingSlug).toBe('')
    expect(editorState.originalText).toBe('')
    expect(editorState.currentText).toBe('')
    expect(editorState.isDirty).toBe(false)
    expect(editorState.isSaving).toBe(false)
    expect(editorState.error).toBe('')
    expect(editorState.conflict).toBe(false)
  })

  it('startEdit sets editing state', () => {
    startEdit('ch01-p001', 'ch01-billi-lugu', 'Original text')
    expect(editorState.editingParaId).toBe('ch01-p001')
    expect(editorState.editingSlug).toBe('ch01-billi-lugu')
    expect(editorState.originalText).toBe('Original text')
    expect(editorState.currentText).toBe('Original text')
    expect(editorState.isDirty).toBe(false)
  })

  it('updateText marks dirty when text differs', () => {
    startEdit('ch01-p001', 'ch01-billi-lugu', 'Original')
    updateText('Modified')
    expect(editorState.currentText).toBe('Modified')
    expect(editorState.isDirty).toBe(true)
  })

  it('updateText clears dirty when text reverts to original', () => {
    startEdit('ch01-p001', 'ch01-billi-lugu', 'Original')
    updateText('Modified')
    expect(editorState.isDirty).toBe(true)
    updateText('Original')
    expect(editorState.isDirty).toBe(false)
  })

  it('cancelEdit resets to idle', () => {
    startEdit('ch01-p001', 'ch01-billi-lugu', 'Original')
    updateText('Modified')
    cancelEdit()
    expect(editorState.editingParaId).toBe('')
    expect(editorState.isDirty).toBe(false)
  })

  it('startSaving sets isSaving flag', () => {
    startEdit('ch01-p001', 'ch01-billi-lugu', 'Original')
    updateText('Modified')
    startSaving()
    expect(editorState.isSaving).toBe(true)
  })

  it('commitSuccess resets to idle', () => {
    startEdit('ch01-p001', 'ch01-billi-lugu', 'Original')
    updateText('Modified')
    startSaving()
    commitSuccess()
    expect(editorState.editingParaId).toBe('')
    expect(editorState.isSaving).toBe(false)
  })

  it('commitConflict sets conflict state', () => {
    startEdit('ch01-p001', 'ch01-billi-lugu', 'Original')
    startSaving()
    commitConflict()
    expect(editorState.conflict).toBe(true)
    expect(editorState.isSaving).toBe(false)
  })

  it('commitError sets error message', () => {
    startEdit('ch01-p001', 'ch01-billi-lugu', 'Original')
    startSaving()
    commitError('Network failure')
    expect(editorState.error).toBe('Network failure')
    expect(editorState.isSaving).toBe(false)
  })
})
