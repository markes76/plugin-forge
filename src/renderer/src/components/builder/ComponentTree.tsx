import { usePlugin } from '@/hooks/usePluginState'
import {
  Sparkles,
  Bot,
  Terminal,
  Webhook,
  Server,
  FileJson,
  ChevronRight,
  Trash2,
  Plus
} from 'lucide-react'
import type { PluginComponent } from '@/types/plugin'

const typeConfig = {
  skill: { icon: Sparkles, label: 'Skills', folder: 'skills/' },
  agent: { icon: Bot, label: 'Agents', folder: 'agents/' },
  command: { icon: Terminal, label: 'Commands', folder: 'commands/' },
  hooks: { icon: Webhook, label: 'Hooks', folder: 'hooks/' },
  mcpServers: { icon: Server, label: 'MCP Servers', folder: '' }
} as const

type ComponentType = keyof typeof typeConfig

export function ComponentTree() {
  const { state, dispatch, addSkill, addAgent, addCommand, addHookRule, addMcpServer } = usePlugin()

  const grouped = state.components.reduce(
    (acc, c) => {
      if (!acc[c.type]) acc[c.type] = []
      acc[c.type].push(c)
      return acc
    },
    {} as Record<string, PluginComponent[]>
  )

  // MCP mode is now on root state
  const mcpIsCoworkMode = state.mcpMode === 'cowork'

  const handleAdd = (type: string) => {
    switch (type) {
      case 'skill': addSkill(); break
      case 'agent': addAgent(); break
      case 'command': addCommand(); break
      case 'hooks': addHookRule(); break
      case 'mcpServers':
        if (!mcpIsCoworkMode) addMcpServer()
        break
    }
  }

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-section-heading font-heading" style={{ color: 'var(--text-primary)' }}>
          Components
        </h3>
      </div>

      {/* Plugin root */}
      <div className="text-small px-2 py-1 rounded flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
        <FileJson size={14} />
        <span>plugin.json</span>
      </div>

      {/* Component groups */}
      {(Object.keys(typeConfig) as ComponentType[]).map((type) => {
        const config = typeConfig[type]
        const Icon = config.icon
        const items = grouped[type] || []

        // In Cowork mode, replace "MCP Servers" with "Connectors" and read from root state
        const isMcpInCowork = type === 'mcpServers' && mcpIsCoworkMode
        const displayLabel = isMcpInCowork ? 'Connectors' : config.label
        const displayCount = isMcpInCowork
          ? state.coworkConnectors.length
          : type === 'hooks'
            ? (items[0] as any)?.rules?.length || 0
            : type === 'mcpServers'
              ? (items[0] as any)?.servers?.length || 0
              : items.length

        return (
          <div key={type} className="mt-2">
            <div className="flex items-center justify-between group">
              <div
                className="flex items-center gap-1.5 text-small px-2 py-1 cursor-pointer"
                onClick={isMcpInCowork ? () => dispatch({ type: 'SET_ACTIVE_COMPONENT', payload: { id: '__connectors__' } }) : undefined}
                style={{ color: 'var(--text-secondary)' }}
              >
                <Icon size={14} />
                <span>{displayLabel}</span>
                {displayCount > 0 && (
                  <span
                    className="text-small px-1 rounded"
                    style={{ backgroundColor: 'var(--bg-elevated)', color: 'var(--text-muted)' }}
                  >
                    {displayCount}
                  </span>
                )}
              </div>
              {/* Hide add button for MCP in Cowork mode */}
              {!isMcpInCowork && (
                <button
                  onClick={() => handleAdd(type)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded"
                  style={{ color: 'var(--text-muted)' }}
                  title={`Add ${type}`}
                >
                  <Plus size={14} />
                </button>
              )}
            </div>

            {/* Cowork connectors — rendered from root state, not components */}
            {type === 'mcpServers' && isMcpInCowork && state.coworkConnectors.map((connectorId) => (
              <TreeItem
                key={connectorId}
                id={connectorId}
                label={connectorId}
                isActive={state.activeComponentId === '__connectors__'}
                onClick={() => {
                  dispatch({ type: 'SET_ACTIVE_COMPONENT', payload: { id: '__connectors__' } })
                }}
              />
            ))}

            {/* Individual items (non-MCP, or MCP in Claude Code mode) */}
            {items.map((item) => {
              if (item.type === 'hooks') {
                const subItems = (item as any).rules || []
                return subItems.map((sub: any) => (
                  <TreeItem
                    key={sub.id}
                    id={sub.id}
                    label={sub.name || sub.event || 'Untitled'}
                    isActive={false}
                    onClick={() => dispatch({ type: 'SET_ACTIVE_COMPONENT', payload: { id: item.id } })}
                  />
                ))
              }
              if (item.type === 'mcpServers' && !isMcpInCowork) {
                // Claude Code mode — show server sub-items
                const subItems = (item as any).servers || []
                return subItems.map((sub: any) => (
                  <TreeItem
                    key={sub.id}
                    id={sub.id}
                    label={sub.name || 'Untitled'}
                    isActive={false}
                    onClick={() => dispatch({ type: 'SET_ACTIVE_COMPONENT', payload: { id: item.id } })}
                  />
                ))
              }

              return (
                <TreeItem
                  key={item.id}
                  id={item.id}
                  label={(item as any).name || 'Untitled'}
                  isActive={state.activeComponentId === item.id}
                  onClick={() =>
                    dispatch({ type: 'SET_ACTIVE_COMPONENT', payload: { id: item.id } })
                  }
                  onDelete={() =>
                    dispatch({ type: 'REMOVE_COMPONENT', payload: { id: item.id } })
                  }
                />
              )
            })}
          </div>
        )
      })}

      {/* Add component dropdown */}
      <div className="mt-4 pt-3 border-t" style={{ borderColor: 'var(--border)' }}>
        <AddComponentMenu onAdd={handleAdd} mcpIsCoworkMode={mcpIsCoworkMode} />
      </div>
    </div>
  )
}

function TreeItem({
  id,
  label,
  isActive,
  onClick,
  onDelete
}: {
  id: string
  label: string
  isActive: boolean
  onClick: () => void
  onDelete?: () => void
}) {
  return (
    <div
      className="flex items-center gap-1.5 text-small px-2 py-1 ml-4 rounded cursor-pointer group"
      style={{
        backgroundColor: isActive ? 'var(--accent-muted)' : 'transparent',
        color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)'
      }}
      onClick={onClick}
      onMouseEnter={(e) => {
        if (!isActive) e.currentTarget.style.backgroundColor = 'var(--bg-elevated)'
      }}
      onMouseLeave={(e) => {
        if (!isActive) e.currentTarget.style.backgroundColor = 'transparent'
      }}
    >
      <ChevronRight size={12} style={{ color: 'var(--text-muted)' }} />
      <span className="flex-1 truncate">{label || 'Untitled'}</span>
      {onDelete && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onDelete()
          }}
          className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-[var(--error)]"
          style={{ color: 'var(--text-muted)' }}
        >
          <Trash2 size={12} />
        </button>
      )}
    </div>
  )
}

function AddComponentMenu({ onAdd, mcpIsCoworkMode }: { onAdd: (type: string) => void; mcpIsCoworkMode: boolean }) {
  const items = [
    { type: 'skill', icon: Sparkles, label: 'Add Skill' },
    { type: 'agent', icon: Bot, label: 'Add Agent' },
    { type: 'command', icon: Terminal, label: 'Add Command' },
    { type: 'hooks', icon: Webhook, label: 'Add Hook Rule' },
    // In Cowork mode, hide "Add MCP Server" — connectors are managed in the MCP editor
    ...(!mcpIsCoworkMode ? [{ type: 'mcpServers', icon: Server, label: 'Add MCP Server' }] : [])
  ]

  return (
    <div className="space-y-0.5">
      {items.map((item) => {
        const Icon = item.icon
        return (
          <button
            key={item.type}
            onClick={() => onAdd(item.type)}
            className="flex items-center gap-2 w-full text-small px-2 py-1.5 rounded transition-colors"
            style={{ color: 'var(--text-muted)' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--bg-elevated)'
              e.currentTarget.style.color = 'var(--text-primary)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent'
              e.currentTarget.style.color = 'var(--text-muted)'
            }}
          >
            <Plus size={14} />
            <Icon size={14} />
            <span>{item.label}</span>
          </button>
        )
      })}
    </div>
  )
}
