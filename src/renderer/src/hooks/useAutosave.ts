import { useState, useCallback, useEffect, useRef } from 'react'
import type { PluginState, WizardState, BuilderMode } from '@/types/plugin'

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'unsaved'

interface ManualSaveOptions {
  pluginState: PluginState
  wizardState?: WizardState | null
  mode: BuilderMode
  wizardStep?: number | null
}

export function useManualSave({
  pluginState,
  wizardState,
  mode,
  wizardStep
}: ManualSaveOptions) {
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
  const [hasSavedOnce, setHasSavedOnce] = useState(false)
  const [lastSavedSnapshot, setLastSavedSnapshot] = useState<string>('')
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Current state fingerprint for change detection
  const currentSnapshot = JSON.stringify({
    metadata: pluginState.metadata,
    components: pluginState.components,
    mcpMode: pluginState.mcpMode,
    coworkConnectors: pluginState.coworkConnectors
  })

  // Detect unsaved changes
  const hasUnsavedChanges = hasSavedOnce
    ? currentSnapshot !== lastSavedSnapshot
    : pluginState.metadata.name !== '' || pluginState.components.length > 0 || pluginState.coworkConnectors.length > 0

  useEffect(() => {
    if (hasUnsavedChanges && saveStatus === 'idle') {
      setSaveStatus('unsaved')
    }
  }, [hasUnsavedChanges, saveStatus])

  const performSave = useCallback(async (): Promise<boolean> => {
    if (!pluginState.id) return false

    setSaveStatus('saving')
    try {
      await window.pluginForge.saveDraft(
        pluginState.id,
        {
          id: pluginState.id,
          metadata: pluginState.metadata,
          components: pluginState.components,
          outputPath: pluginState.outputPath,
          mcpMode: pluginState.mcpMode,
          coworkConnectors: pluginState.coworkConnectors
        },
        wizardState || undefined,
        {
          id: pluginState.id,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          name: pluginState.metadata.name || 'Untitled',
          mode,
          wizardStep: wizardStep ?? null,
          lastActiveComponentId: pluginState.activeComponentId || null
        }
      )

      setHasSavedOnce(true)
      setLastSavedSnapshot(currentSnapshot)
      setSaveStatus('saved')

      if (savedTimerRef.current) clearTimeout(savedTimerRef.current)
      savedTimerRef.current = setTimeout(() => setSaveStatus('idle'), 1500)

      return true
    } catch (err) {
      console.error('Save failed:', err)
      setSaveStatus('unsaved')
      return false
    }
  }, [pluginState, wizardState, mode, wizardStep, currentSnapshot])

  // Keyboard shortcut: Cmd/Ctrl + S
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault()
        performSave()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [performSave])

  // If loading an existing draft, mark as already saved
  useEffect(() => {
    if (pluginState.lastSavedAt) {
      setHasSavedOnce(true)
      setLastSavedSnapshot(currentSnapshot)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return {
    saveStatus: hasUnsavedChanges && saveStatus === 'idle' ? 'unsaved' as SaveStatus : saveStatus,
    hasUnsavedChanges,
    save: performSave
  }
}
