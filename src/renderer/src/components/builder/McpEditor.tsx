import { useState, useEffect } from 'react'
import { usePlugin } from '@/hooks/usePluginState'
import { nanoid } from 'nanoid'
import { Plus, Trash2, X, Search, Check } from 'lucide-react'
import type { ConnectorEntry } from '@/lib/constants'
import type { McpServersComponent, McpServerEntry } from '@/types/plugin'

interface McpEditorProps {
  mcpServers?: McpServersComponent
}

export function McpEditor({ mcpServers }: McpEditorProps) {
  const { state, dispatch } = usePlugin()
  const mode = state.mcpMode || 'cowork'

  const setMode = (newMode: 'cowork' | 'claude-code') => {
    dispatch({ type: 'SET_MCP_MODE', payload: { mode: newMode } })
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      <h2 className="text-page-title font-heading" style={{ color: 'var(--text-primary)' }}>
        Connectors & MCP Servers
      </h2>

      {/* Mode toggle */}
      <div className="surface-panel p-4 space-y-3" data-panel>
        <p className="text-body font-medium" style={{ color: 'var(--text-secondary)' }}>
          How will this plugin be used?
        </p>
        <div className="flex gap-2">
          <ModeButton
            active={mode === 'cowork'}
            label="Cowork"
            description="Declare which connectors your plugin needs"
            onClick={() => setMode('cowork')}
          />
          <ModeButton
            active={mode === 'claude-code'}
            label="Claude Code"
            description="Configure MCP server commands to start locally"
            onClick={() => setMode('claude-code')}
          />
        </div>
      </div>

      {mode === 'cowork' ? (
        <CoworkModeEditor />
      ) : (
        <ClaudeCodeModeEditor mcpServers={mcpServers} />
      )}
    </div>
  )
}

function ModeButton({
  active,
  label,
  description,
  onClick
}: {
  active: boolean
  label: string
  description: string
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="flex-1 p-3 rounded text-left transition-colors"
      style={{
        backgroundColor: active ? 'var(--accent-muted)' : 'var(--bg-input)',
        border: `1px solid ${active ? 'var(--accent)' : 'var(--border)'}`
      }}
    >
      <span className="text-body font-medium block" style={{ color: active ? 'var(--accent)' : 'var(--text-primary)' }}>
        {label}
      </span>
      <span className="text-small block mt-0.5" style={{ color: 'var(--text-muted)' }}>
        {description}
      </span>
    </button>
  )
}

// ── Cowork Mode ──

function CoworkModeEditor() {
  const { state, dispatch } = usePlugin()
  const [search, setSearch] = useState('')
  const [registry, setRegistry] = useState<ConnectorEntry[]>([])

  // Load connector registry from disk
  useEffect(() => {
    window.pluginForge.getConnectors().then(setRegistry)
  }, [])

  const selectedIds = new Set(state.coworkConnectors)

  const filtered = registry.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.description.toLowerCase().includes(search.toLowerCase())
  )

  const toggleConnector = (connector: ConnectorEntry) => {
    const current = state.coworkConnectors
    const updated = selectedIds.has(connector.id)
      ? current.filter((id) => id !== connector.id)
      : [...current, connector.id]
    dispatch({ type: 'SET_COWORK_CONNECTORS', payload: { connectors: updated } })
  }

  return (
    <>
      <div>
        <p className="text-body mb-3" style={{ color: 'var(--text-secondary)' }}>
          Which connectors does your plugin need?
        </p>

        {/* Search */}
        <div className="relative mb-4">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2"
            style={{ color: 'var(--text-muted)' }}
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search connectors..."
            className="w-full h-9 pl-8"
          />
        </div>

        {/* Connector list */}
        <div className="space-y-1.5">
          {filtered.map((connector) => {
            const isSelected = selectedIds.has(connector.id)

            return (
              <div
                key={connector.id}
                className="flex items-center gap-3 p-3 rounded cursor-pointer transition-colors"
                style={{
                  backgroundColor: isSelected ? 'var(--accent-muted)' : 'var(--bg-input)',
                  border: `1px solid ${isSelected ? 'var(--accent)' : 'var(--border)'}`
                }}
                onClick={() => toggleConnector(connector)}
              >
                {/* Checkbox */}
                <div
                  className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0"
                  style={{
                    backgroundColor: isSelected ? 'var(--accent)' : 'transparent',
                    border: `1.5px solid ${isSelected ? 'var(--accent)' : 'var(--text-muted)'}`
                  }}
                >
                  {isSelected && <Check size={10} style={{ color: 'var(--text-on-accent)' }} />}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <span className="text-body font-medium" style={{ color: 'var(--text-primary)' }}>
                    {connector.name}
                  </span>
                  <span className="text-small block" style={{ color: 'var(--text-muted)' }}>
                    {connector.description}
                  </span>
                </div>

                {/* Selected indicator */}
                {isSelected && (
                  <span className="text-small px-2 py-0.5 rounded"
                    style={{ backgroundColor: 'var(--bg-elevated)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>
                    Selected
                  </span>
                )}
              </div>
            )
          })}
        </div>

        <p className="text-small mt-4" style={{ color: 'var(--text-muted)' }}>
          Don't see your connector? Add it in Settings → Connectors, or switch to Claude Code mode for manual MCP config.
        </p>
      </div>

      {/* Selected summary */}
      {state.coworkConnectors.length > 0 && (
        <div className="surface-panel p-4" data-panel>
          <h4 className="text-small font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
            Selected ({state.coworkConnectors.length})
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {state.coworkConnectors.map((id) => {
              const conn = registry.find((c) => c.id === id)
              return (
                <span
                  key={id}
                  className="text-small px-2 py-0.5 rounded"
                  style={{ backgroundColor: 'var(--accent-muted)', color: 'var(--accent)' }}
                >
                  {conn?.name || id}
                </span>
              )
            })}
          </div>
        </div>
      )}
    </>
  )
}

// ── Claude Code Mode (existing behavior) ──

function ClaudeCodeModeEditor({ mcpServers }: { mcpServers: McpServersComponent }) {
  const { dispatch } = usePlugin()

  return (
    <>
      <div className="flex items-center justify-between">
        <p className="text-body" style={{ color: 'var(--text-secondary)' }}>
          Configure MCP servers that Claude Code will start locally.
        </p>
        <button
          onClick={() =>
            dispatch({
              type: 'ADD_MCP_SERVER',
              payload: { id: nanoid(), name: '', command: '', args: [], env: {} }
            })
          }
          className="flex items-center gap-1.5 text-small px-3 py-1.5 rounded transition-colors"
          data-accent="true"
          style={{ backgroundColor: 'var(--accent)', color: 'var(--text-on-accent)' }}
        >
          <Plus size={14} />
          Add Server
        </button>
      </div>

      {mcpServers.servers.length === 0 && (
        <div className="text-center py-12" style={{ color: 'var(--text-muted)' }}>
          No MCP servers configured. Click "Add Server" to create one.
        </div>
      )}

      <div className="space-y-4">
        {mcpServers.servers.map((server) => (
          <ServerCard
            key={server.id}
            server={server}
            onUpdate={(changes) =>
              dispatch({ type: 'UPDATE_MCP_SERVER', payload: { id: server.id, changes } })
            }
            onDelete={() =>
              dispatch({ type: 'REMOVE_MCP_SERVER', payload: { id: server.id } })
            }
          />
        ))}
      </div>
    </>
  )
}

function ServerCard({
  server,
  onUpdate,
  onDelete
}: {
  server: McpServerEntry
  onUpdate: (changes: Partial<McpServerEntry>) => void
  onDelete: () => void
}) {
  return (
    <div className="surface-panel p-5 space-y-4" data-panel>
      <div className="flex items-center justify-between">
        <span className="text-section-heading font-heading" style={{ color: 'var(--text-primary)' }}>
          {server.name || 'Untitled Server'}
        </span>
        <button onClick={onDelete} className="p-1 rounded" style={{ color: 'var(--text-muted)' }}>
          <Trash2 size={14} />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-small mb-1" style={{ color: 'var(--text-secondary)' }}>
            Name <span style={{ color: 'var(--error)' }}>*</span>
          </label>
          <input
            type="text"
            value={server.name}
            onChange={(e) => onUpdate({ name: e.target.value })}
            placeholder="my-mcp-server"
            className="w-full h-9"
          />
        </div>
        <div>
          <label className="block text-small mb-1" style={{ color: 'var(--text-secondary)' }}>
            Command <span style={{ color: 'var(--error)' }}>*</span>
          </label>
          <input
            type="text"
            value={server.command}
            onChange={(e) => onUpdate({ command: e.target.value })}
            placeholder="npx"
            className="w-full h-9 font-mono text-code"
          />
        </div>
      </div>

      {/* Args */}
      <div>
        <label className="block text-small mb-1" style={{ color: 'var(--text-secondary)' }}>Arguments</label>
        <div className="space-y-1.5">
          {server.args.map((arg, i) => (
            <div key={i} className="flex gap-2">
              <input
                type="text"
                value={arg}
                onChange={(e) => {
                  const newArgs = [...server.args]
                  newArgs[i] = e.target.value
                  onUpdate({ args: newArgs })
                }}
                className="flex-1 h-8 font-mono text-code"
              />
              <button onClick={() => onUpdate({ args: server.args.filter((_, j) => j !== i) })} className="p-1 rounded" style={{ color: 'var(--text-muted)' }}>
                <X size={14} />
              </button>
            </div>
          ))}
          <button onClick={() => onUpdate({ args: [...server.args, ''] })} className="flex items-center gap-1 text-small px-2 py-1 rounded" style={{ color: 'var(--text-muted)' }}>
            <Plus size={12} /> Add argument
          </button>
        </div>
      </div>

      {/* Env vars */}
      <div>
        <label className="block text-small mb-1" style={{ color: 'var(--text-secondary)' }}>Environment Variables</label>
        <div className="space-y-1.5">
          {Object.entries(server.env).map(([key, value]) => (
            <div key={key} className="flex gap-2">
              <input type="text" value={key} onChange={(e) => { const newEnv = { ...server.env }; delete newEnv[key]; newEnv[e.target.value] = value; onUpdate({ env: newEnv }) }} placeholder="KEY" className="w-1/3 h-8 font-mono text-code" />
              <input type="text" value={value} onChange={(e) => onUpdate({ env: { ...server.env, [key]: e.target.value } })} placeholder="value" className="flex-1 h-8 font-mono text-code" />
              <button onClick={() => { const newEnv = { ...server.env }; delete newEnv[key]; onUpdate({ env: newEnv }) }} className="p-1 rounded" style={{ color: 'var(--text-muted)' }}>
                <X size={14} />
              </button>
            </div>
          ))}
          <button onClick={() => onUpdate({ env: { ...server.env, '': '' } })} className="flex items-center gap-1 text-small px-2 py-1 rounded" style={{ color: 'var(--text-muted)' }}>
            <Plus size={12} /> Add variable
          </button>
        </div>
      </div>
    </div>
  )
}
