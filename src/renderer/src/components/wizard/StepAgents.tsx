import { Plus, Trash2 } from 'lucide-react'
import type { AgentComponent, EffortLevel } from '@/types/plugin'

interface StepAgentsProps {
  agents: AgentComponent[]
  onAdd: () => void
  onUpdate: (id: string, changes: Partial<AgentComponent>) => void
  onRemove: (id: string) => void
}

const effortLabels: Record<string, { label: string; effort: EffortLevel }> = {
  low: { label: 'Quick review', effort: 'low' },
  medium: { label: 'Standard', effort: 'medium' },
  high: { label: 'Deep analysis', effort: 'high' }
}

export function StepAgents({ agents, onAdd, onUpdate, onRemove }: StepAgentsProps) {
  return (
    <div className="max-w-2xl mx-auto p-8 space-y-6">
      <div>
        <h2 className="text-page-title font-heading mb-2" style={{ color: 'var(--text-primary)' }}>
          Create specialist agents
        </h2>
        <p className="text-body" style={{ color: 'var(--text-secondary)' }}>
          Agents are like team members with specific expertise. Claude can delegate tasks to them automatically, or you can invoke them directly.
        </p>
      </div>

      <div className="space-y-4">
        {agents.map((agent, index) => (
          <div key={agent.id} className="surface-panel p-5 space-y-4" data-panel>
            <div className="flex items-center justify-between">
              <span className="text-section-heading font-heading" style={{ color: 'var(--text-primary)' }}>
                Agent {index + 1}
              </span>
              {agents.length > 1 && (
                <button onClick={() => onRemove(agent.id)} className="p-1 rounded" style={{ color: 'var(--text-muted)' }}>
                  <Trash2 size={14} />
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-body font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                  Agent name
                </label>
                <input
                  type="text"
                  value={agent.name}
                  onChange={(e) =>
                    onUpdate(agent.id, {
                      name: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-')
                    })
                  }
                  placeholder="code-reviewer"
                  className="w-full h-9"
                />
              </div>
              <div>
                <label className="block text-body font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                  Expertise level
                </label>
                <select
                  value={agent.effort || 'medium'}
                  onChange={(e) => onUpdate(agent.id, { effort: e.target.value as EffortLevel })}
                  className="w-full h-9"
                >
                  {Object.entries(effortLabels).map(([key, { label }]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-body font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                What does this agent do?
              </label>
              <textarea
                value={agent.description}
                onChange={(e) => onUpdate(agent.id, { description: e.target.value })}
                placeholder="Describe the agent's specialty..."
                className="w-full h-16 resize-none"
                rows={2}
              />
            </div>

            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <div
                  className="w-8 h-[18px] rounded-full relative cursor-pointer transition-colors"
                  style={{
                    backgroundColor: agent.disallowedTools?.includes('Write')
                      ? 'var(--bg-input)'
                      : 'var(--accent)',
                    border: `1px solid ${agent.disallowedTools?.includes('Write') ? 'var(--border)' : 'var(--accent)'}`
                  }}
                  onClick={() => {
                    const cantEdit = agent.disallowedTools?.includes('Write')
                    onUpdate(agent.id, {
                      disallowedTools: cantEdit ? [] : ['Write', 'Edit']
                    })
                  }}
                >
                  <div
                    className="w-3.5 h-3.5 rounded-full absolute top-0.5 transition-all"
                    style={{
                      backgroundColor: agent.disallowedTools?.includes('Write') ? 'var(--text-muted)' : 'white',
                      left: agent.disallowedTools?.includes('Write') ? '1px' : '14px'
                    }}
                  />
                </div>
                <span className="text-body" style={{ color: 'var(--text-secondary)' }}>
                  Can edit files
                </span>
              </label>
            </div>

            <div>
              <label className="block text-body font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                Agent instructions
              </label>
              <textarea
                value={agent.body}
                onChange={(e) => onUpdate(agent.id, { body: e.target.value })}
                placeholder="Describe the agent's role, focus areas, and how it should report findings..."
                className="w-full font-mono text-code resize-none"
                style={{ minHeight: '120px' }}
                rows={6}
              />
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={onAdd}
        className="flex items-center gap-2 text-body px-4 py-2 rounded transition-colors w-full justify-center"
        style={{ backgroundColor: 'var(--bg-elevated)', color: 'var(--text-secondary)', border: '1px dashed var(--border)' }}
      >
        <Plus size={16} />
        Add another agent
      </button>
    </div>
  )
}
