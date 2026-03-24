import { useMemo, useState, useEffect, useCallback } from 'react'
import { useSearchParams, useParams } from 'react-router-dom'
import { Hammer, Download } from 'lucide-react'
import { PluginProvider, usePlugin, createInitialState } from '@/hooks/usePluginState'
import { useManualSave } from '@/hooks/useAutosave'
import { getTemplate } from '@/lib/templates'
import { generatePlugin } from '@/lib/plugin-generator'
import { validatePlugin } from '@/lib/validators'
import { PluginMetaForm } from '@/components/builder/PluginMetaForm'
import { ComponentTree } from '@/components/builder/ComponentTree'
import { SkillEditor } from '@/components/builder/SkillEditor'
import { AgentEditor } from '@/components/builder/AgentEditor'
import { CommandEditor } from '@/components/builder/CommandEditor'
import { HookEditor } from '@/components/builder/HookEditor'
import { McpEditor } from '@/components/builder/McpEditor'
import { FileTreePreview } from '@/components/builder/FileTreePreview'
import { ValidationPanel } from '@/components/builder/ValidationPanel'
import { SaveIndicator } from '@/components/shared/SaveIndicator'
import { VersionBumpDialog, detectBumpType } from '@/components/shared/VersionBumpDialog'
import type {
  PluginState,
  SkillComponent,
  AgentComponent,
  CommandComponent,
  HooksComponent,
  McpServersComponent
} from '@/types/plugin'

export function Builder() {
  const [searchParams] = useSearchParams()
  const { id: pluginId } = useParams<{ id: string }>()
  const templateId = searchParams.get('template')
  const [loadedState, setLoadedState] = useState<PluginState | undefined>(undefined)
  const [loading, setLoading] = useState(!!pluginId)

  // Load existing plugin or draft by ID
  useEffect(() => {
    if (!pluginId) {
      setLoading(false)
      return
    }

    async function load() {
      // Try loading from draft first
      const draft = await window.pluginForge.loadDraft(pluginId!)
      if (draft?.pluginState) {
        setLoadedState(draft.pluginState as PluginState)
        setLoading(false)
        return
      }
      // Try loading from generated state
      const generated = await window.pluginForge.loadGeneratedState(pluginId!)
      if (generated) {
        setLoadedState(generated as PluginState)
        setLoading(false)
        return
      }
      setLoading(false)
    }

    load()
  }, [pluginId])

  const initialState = useMemo(() => {
    if (loadedState) return loadedState
    if (templateId) return getTemplate(templateId) ?? undefined
    return undefined
  }, [loadedState, templateId])

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-body" style={{ color: 'var(--text-muted)' }}>Loading plugin...</p>
      </div>
    )
  }

  return (
    <PluginProvider initialState={initialState}>
      <BuilderWorkspace />
    </PluginProvider>
  )
}

function BuilderWorkspace() {
  const { state, dispatch } = usePlugin()
  const { saveStatus, hasUnsavedChanges, save } = useManualSave({
    pluginState: state,
    mode: 'advanced'
  })

  const [showVersionBump, setShowVersionBump] = useState(false)

  const activeComponent = state.activeComponentId
    ? state.components.find((c) => c.id === state.activeComponentId)
    : undefined

  const issues = useMemo(() => validatePlugin(state), [state])
  const hasErrors = issues.some((i) => i.severity === 'error')

  const handleGenerate = useCallback(async () => {
    if (hasErrors) return

    // Build plugin files
    const files = generatePlugin(state)

    // If Cowork mode, patch .mcp.json with real URLs from connector registry
    if (state.mcpMode === 'cowork' && state.coworkConnectors.length > 0) {
      const registry = await window.pluginForge.getConnectors()
      const mcpFileIdx = files.findIndex(f => f.relativePath === '.mcp.json')
      if (mcpFileIdx >= 0) {
        const mcpServers: Record<string, { type: string; url: string }> = {}
        for (const id of state.coworkConnectors) {
          const connector = registry.find((c: any) => c.id === id)
          if (connector) mcpServers[id] = { type: 'http', url: connector.url }
        }
        files[mcpFileIdx] = {
          relativePath: '.mcp.json',
          content: JSON.stringify({ mcpServers }, null, 2)
        }
      }
    }

    // Generate as ZIP (opens native Save dialog)
    const result = await window.pluginForge.generatePluginZip(
      files,
      state.metadata.name || 'my-plugin'
    )
    if (!result?.success || !result?.path) return

    // Save generated state and update registry to "generated"
    await window.pluginForge.saveGeneratedState(state.id, state)
    await window.pluginForge.updateRegistryEntry(state.id, {
      status: 'generated',
      generatedAt: new Date().toISOString(),
      lastOutputPath: result.path
    })
    // Also persist the draft so it matches
    await save()
    dispatch({ type: 'MARK_SAVED', payload: { timestamp: Date.now() } })
  }, [state, hasErrors, dispatch, save])

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header bar with save indicator and generate button */}
      <div
        className="h-11 px-4 flex items-center justify-between border-b flex-shrink-0"
        style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-base)' }}
      >
        <div className="flex items-center gap-3">
          <span className="text-body font-medium" style={{ color: 'var(--text-primary)' }}>
            {state.metadata.name || 'Untitled Plugin'}
          </span>
          {state.metadata.version && (
            <span className="text-small font-mono" style={{ color: 'var(--text-muted)' }}>
              v{state.metadata.version}
            </span>
          )}
          <SaveIndicator status={saveStatus} hasUnsavedChanges={hasUnsavedChanges} onSave={save} />
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleGenerate}
            disabled={hasErrors}
            className="flex items-center gap-1.5 text-body font-medium px-4 py-1.5 rounded transition-colors"
            data-accent="true"
            style={{
              backgroundColor: hasErrors ? 'var(--bg-elevated)' : 'var(--accent)',
              color: hasErrors ? 'var(--text-muted)' : 'var(--text-on-accent)',
              cursor: hasErrors ? 'not-allowed' : 'pointer',
              opacity: hasErrors ? 0.5 : 1
            }}
            title={hasErrors ? 'Fix validation errors before generating' : 'Generate plugin files'}
          >
            <Download size={14} />
            Generate Plugin
          </button>
        </div>
      </div>

      {/* Main workspace */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left panel — metadata + component tree */}
        <div
          className="w-[280px] border-r flex flex-col overflow-y-auto"
          style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-base)' }}
        >
          <div className="p-4 border-b" style={{ borderColor: 'var(--border)' }}>
            <PluginMetaForm />
          </div>
          <div className="p-4 flex-1">
            <ComponentTree />
          </div>
        </div>

        {/* Center panel — editor area */}
        <div className="flex-1 flex flex-col overflow-hidden" style={{ backgroundColor: 'var(--bg-surface)' }}>
          {state.activeComponentId === '__connectors__' ? (
            <McpEditor />
          ) : activeComponent ? (
            <ComponentEditorSwitch component={activeComponent} />
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center space-y-3">
                <Hammer size={40} style={{ color: 'var(--text-muted)', opacity: 0.3 }} />
                <p className="text-body" style={{ color: 'var(--text-muted)' }}>
                  Select a component to edit, or add a new one from the left panel.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Right panel — preview + validation */}
        <div
          className="w-[320px] border-l flex flex-col overflow-y-auto"
          style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-base)' }}
        >
          <div className="border-b" style={{ borderColor: 'var(--border)' }}>
            <FileTreePreview />
          </div>
          <ValidationPanel />
        </div>
      </div>

      {/* Version Bump Dialog */}
      {showVersionBump && (
        <VersionBumpDialog
          currentVersion={state.metadata.version}
          autoChangelog="Updated content"
          suggestedBump="patch"
          onConfirm={async (newVersion, changelog) => {
            dispatch({ type: 'SET_METADATA', payload: { version: newVersion } })
            setShowVersionBump(false)
            // Proceed with generation
            handleGenerate()
          }}
          onCancel={() => setShowVersionBump(false)}
        />
      )}
    </div>
  )
}

function ComponentEditorSwitch({ component }: { component: NonNullable<ReturnType<typeof usePlugin>['state']['components'][number]> }) {
  switch (component.type) {
    case 'skill':
      return <SkillEditor skill={component as SkillComponent} />
    case 'agent':
      return <AgentEditor agent={component as AgentComponent} />
    case 'command':
      return <CommandEditor command={component as CommandComponent} />
    case 'hooks':
      return <HookEditor hooks={component as HooksComponent} />
    case 'mcpServers':
      return <McpEditor mcpServers={component as McpServersComponent} />
    default:
      return null
  }
}
