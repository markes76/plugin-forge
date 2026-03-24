import { useMemo } from 'react'
import { Server } from 'lucide-react'
import { usePlugin } from '@/hooks/usePluginState'
import { toKebabCase } from '@/lib/utils'
import type { AgentComponent, ModelId, EffortLevel, McpServersComponent } from '@/types/plugin'

const toolOptions = [
  'Bash', 'Read', 'Write', 'Edit', 'Glob', 'Grep', 'LS',
  'WebSearch', 'WebFetch', 'TodoRead', 'TodoWrite', 'Agent'
]

interface AgentEditorProps {
  agent: AgentComponent
}

export function AgentEditor({ agent }: AgentEditorProps) {
  const { state, dispatch } = usePlugin()

  const update = (changes: Partial<AgentComponent>) => {
    dispatch({ type: 'UPDATE_COMPONENT', payload: { id: agent.id, changes } })
  }

  // Get Cowork connector names for the info note
  const connectorNames = useMemo(() => {
    const mcp = state.components.find((c) => c.type === 'mcpServers') as McpServersComponent | undefined
    return mcp?.coworkConnectors?.map((c) => c.name) || []
  }, [state.components])

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      <h2 className="text-page-title font-heading" style={{ color: 'var(--text-primary)' }}>
        Agent Editor
      </h2>

      {/* Connector reference note */}
      {connectorNames.length > 0 && (
        <div
          className="flex items-start gap-2 p-3 rounded text-small"
          style={{
            backgroundColor: 'var(--accent-muted)',
            borderLeft: '3px solid var(--accent)'
          }}
        >
          <Server size={14} style={{ color: 'var(--accent)', marginTop: 1, flexShrink: 0 }} />
          <span style={{ color: 'var(--text-secondary)' }}>
            This plugin uses: <strong style={{ color: 'var(--text-primary)' }}>{connectorNames.join(', ')}</strong>.
            Your agents can reference these tools in their instructions.
          </span>
        </div>
      )}

      {/* Frontmatter */}
      <div className="surface-panel p-5 space-y-4" data-panel>
        <h3 className="text-section-heading font-heading" style={{ color: 'var(--text-primary)' }}>
          Frontmatter
        </h3>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-small mb-1" style={{ color: 'var(--text-secondary)' }}>
              Name <span style={{ color: 'var(--error)' }}>*</span>
            </label>
            <input
              type="text"
              value={agent.name}
              onChange={(e) => update({ name: toKebabCase(e.target.value) })}
              placeholder="my-agent"
              className="w-full h-9"
            />
          </div>
          <div>
            <label className="block text-small mb-1" style={{ color: 'var(--text-secondary)' }}>
              Model
            </label>
            <select
              value={agent.model || ''}
              onChange={(e) => update({ model: (e.target.value || undefined) as ModelId | undefined })}
              className="w-full h-9"
            >
              <option value="">Default</option>
              <option value="opus">Opus</option>
              <option value="sonnet">Sonnet</option>
              <option value="haiku">Haiku</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-small mb-1" style={{ color: 'var(--text-secondary)' }}>
            Description <span style={{ color: 'var(--error)' }}>*</span>
          </label>
          <textarea
            value={agent.description}
            onChange={(e) => update({ description: e.target.value })}
            placeholder="Describe what this agent specializes in..."
            className="w-full h-20 resize-none"
            rows={3}
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-small mb-1" style={{ color: 'var(--text-secondary)' }}>
              Effort
            </label>
            <select
              value={agent.effort || ''}
              onChange={(e) => update({ effort: (e.target.value || undefined) as EffortLevel | undefined })}
              className="w-full h-9"
            >
              <option value="">Default</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
          <div>
            <label className="block text-small mb-1" style={{ color: 'var(--text-secondary)' }}>
              Max Turns
            </label>
            <input
              type="number"
              value={agent.maxTurns ?? ''}
              onChange={(e) => update({ maxTurns: e.target.value ? parseInt(e.target.value) : undefined })}
              placeholder="20"
              min={1}
              max={100}
              className="w-full h-9"
            />
          </div>
          <div>
            <label className="block text-small mb-1" style={{ color: 'var(--text-secondary)' }}>
              Isolation
            </label>
            <select
              value={agent.isolation ? 'worktree' : 'none'}
              onChange={(e) => update({ isolation: e.target.value === 'worktree' })}
              className="w-full h-9"
            >
              <option value="none">None</option>
              <option value="worktree">Worktree</option>
            </select>
          </div>
        </div>

        {/* Toggles */}
        <div className="flex gap-6">
          <ToggleField
            label="Memory"
            checked={agent.memory ?? false}
            onChange={(v) => update({ memory: v || undefined })}
          />
          <ToggleField
            label="Background"
            checked={agent.background ?? false}
            onChange={(v) => update({ background: v || undefined })}
          />
        </div>

        {/* Tools */}
        <div>
          <label className="block text-small mb-2" style={{ color: 'var(--text-secondary)' }}>
            Allowed Tools
          </label>
          <div className="flex flex-wrap gap-2">
            {toolOptions.map((tool) => {
              const isSelected = agent.tools?.includes(tool)
              return (
                <button
                  key={tool}
                  onClick={() => {
                    const current = agent.tools || []
                    update({
                      tools: isSelected
                        ? current.filter((t) => t !== tool)
                        : [...current, tool]
                    })
                  }}
                  className="text-small px-2.5 py-1 rounded transition-colors"
                  style={{
                    backgroundColor: isSelected ? 'var(--accent-muted)' : 'var(--bg-input)',
                    color: isSelected ? 'var(--accent)' : 'var(--text-muted)',
                    border: `1px solid ${isSelected ? 'var(--accent)' : 'var(--border)'}`
                  }}
                >
                  {tool}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* System prompt */}
      <div className="surface-panel p-5 space-y-3" data-panel>
        <h3 className="text-section-heading font-heading" style={{ color: 'var(--text-primary)' }}>
          System Prompt
        </h3>
        <p className="text-small" style={{ color: 'var(--text-muted)' }}>
          The agent's detailed instructions, role, and expertise. Supports markdown.
        </p>
        <textarea
          value={agent.body}
          onChange={(e) => update({ body: e.target.value })}
          placeholder="You are an expert at..."
          className="w-full font-mono text-code resize-none"
          style={{ minHeight: '300px' }}
          rows={15}
        />
      </div>
    </div>
  )
}

function ToggleField({
  label,
  checked,
  onChange
}: {
  label: string
  checked: boolean
  onChange: (val: boolean) => void
}) {
  return (
    <label className="flex items-center gap-2 cursor-pointer">
      <div
        className="w-8 h-[18px] rounded-full relative transition-colors cursor-pointer"
        style={{
          backgroundColor: checked ? 'var(--accent)' : 'var(--bg-input)',
          border: `1px solid ${checked ? 'var(--accent)' : 'var(--border)'}`
        }}
        onClick={() => onChange(!checked)}
      >
        <div
          className="w-3.5 h-3.5 rounded-full absolute top-0.5 transition-all"
          style={{
            backgroundColor: checked ? 'white' : 'var(--text-muted)',
            left: checked ? '14px' : '1px'
          }}
        />
      </div>
      <span className="text-small" style={{ color: 'var(--text-secondary)' }}>
        {label}
      </span>
    </label>
  )
}
