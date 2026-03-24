import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle, XCircle, AlertTriangle, Sparkles, Bot, Terminal, Webhook, Server } from 'lucide-react'
import { validatePlugin } from '@/lib/validators'
import type { PluginState, SkillComponent, AgentComponent, CommandComponent, HooksComponent, McpServersComponent } from '@/types/plugin'

interface StepReviewProps {
  state: PluginState
  onGenerate: () => void
  onGoToStep: (stepId: string) => void
}

export function StepReview({ state, onGenerate, onGoToStep }: StepReviewProps) {
  const navigate = useNavigate()
  const issues = useMemo(() => validatePlugin(state), [state])
  const errors = issues.filter((i) => i.severity === 'error')
  const hasErrors = errors.length > 0

  const skills = state.components.filter((c) => c.type === 'skill') as SkillComponent[]
  const agents = state.components.filter((c) => c.type === 'agent') as AgentComponent[]
  const commands = state.components.filter((c) => c.type === 'command') as CommandComponent[]
  const hooks = state.components.find((c) => c.type === 'hooks') as HooksComponent | undefined
  const mcp = state.components.find((c) => c.type === 'mcpServers') as McpServersComponent | undefined

  return (
    <div className="max-w-2xl mx-auto p-8 space-y-6">
      <div>
        <h2 className="text-page-title font-heading mb-2" style={{ color: 'var(--text-primary)' }}>
          Review your plugin
        </h2>
        <p className="text-body" style={{ color: 'var(--text-secondary)' }}>
          Here's a summary of everything that will be generated.
        </p>
      </div>

      {/* Plugin identity */}
      <div className="surface-panel p-5" data-panel>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-section-heading font-heading" style={{ color: 'var(--text-primary)' }}>
            {state.metadata.name || 'Untitled Plugin'}
          </h3>
          <EditLink onClick={() => onGoToStep('identity')} />
        </div>
        <p className="text-body" style={{ color: 'var(--text-secondary)' }}>
          {state.metadata.description || 'No description'}
        </p>
      </div>

      {/* Skills */}
      {skills.length > 0 && (
        <ReviewSection
          icon={Sparkles}
          title={`Skills (${skills.length})`}
          onEdit={() => onGoToStep('skills')}
        >
          {skills.map((s) => (
            <div key={s.id} className="flex items-start gap-2 py-1">
              <span className="text-body font-medium" style={{ color: 'var(--text-primary)' }}>{s.name || 'Untitled'}</span>
              <span className="text-small" style={{ color: 'var(--text-muted)' }}>{s.description}</span>
            </div>
          ))}
        </ReviewSection>
      )}

      {/* Agents */}
      {agents.length > 0 && (
        <ReviewSection
          icon={Bot}
          title={`Agents (${agents.length})`}
          onEdit={() => onGoToStep('agents')}
        >
          {agents.map((a) => (
            <div key={a.id} className="flex items-start gap-2 py-1">
              <span className="text-body font-medium" style={{ color: 'var(--text-primary)' }}>{a.name || 'Untitled'}</span>
              <span className="text-small" style={{ color: 'var(--text-muted)' }}>{a.effort || 'standard'}</span>
            </div>
          ))}
        </ReviewSection>
      )}

      {/* Commands */}
      {commands.length > 0 && (
        <ReviewSection
          icon={Terminal}
          title={`Commands (${commands.length})`}
          onEdit={() => onGoToStep('commands')}
        >
          {commands.map((c) => (
            <div key={c.id} className="py-1">
              <span className="font-mono text-code" style={{ color: 'var(--accent)' }}>
                /{state.metadata.name}:{c.name}
              </span>
            </div>
          ))}
        </ReviewSection>
      )}

      {/* Hooks */}
      {hooks && hooks.rules.length > 0 && (
        <ReviewSection
          icon={Webhook}
          title={`Hooks (${hooks.rules.length})`}
          onEdit={() => onGoToStep('hooks')}
        >
          {hooks.rules.map((r) => (
            <div key={r.id} className="text-small py-1" style={{ color: 'var(--text-secondary)' }}>
              {r.event}{r.matcher ? ` on ${r.matcher}` : ''} → {r.hookType}
            </div>
          ))}
        </ReviewSection>
      )}

      {/* MCP */}
      {mcp && mcp.servers.length > 0 && (
        <ReviewSection
          icon={Server}
          title={`Connectors (${mcp.servers.length})`}
          onEdit={() => onGoToStep('connectors')}
        >
          {mcp.servers.map((s) => (
            <div key={s.id} className="text-small py-1" style={{ color: 'var(--text-secondary)' }}>
              {s.name}: {s.command}
            </div>
          ))}
        </ReviewSection>
      )}

      {/* Validation */}
      <div className="surface-panel p-5" data-panel>
        <h3 className="text-section-heading font-heading mb-3" style={{ color: 'var(--text-primary)' }}>
          Validation
        </h3>
        {issues.length === 0 ? (
          <div className="flex items-center gap-2 text-body" style={{ color: 'var(--success)' }}>
            <CheckCircle size={16} />
            All checks passed
          </div>
        ) : (
          <div className="space-y-1.5">
            {issues.map((issue, i) => (
              <div key={i} className="flex items-start gap-2 text-small">
                {issue.severity === 'error' ? (
                  <XCircle size={14} style={{ color: 'var(--error)', marginTop: 1 }} />
                ) : (
                  <AlertTriangle size={14} style={{ color: 'var(--warning)', marginTop: 1 }} />
                )}
                <span style={{ color: 'var(--text-secondary)' }}>{issue.message}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 pt-2">
        <button
          onClick={() => {
            // Navigate to advanced builder with current state
            // The state is shared through the plugin context
            navigate('/builder')
          }}
          className="text-body px-4 py-2 rounded transition-colors"
          style={{
            backgroundColor: 'var(--bg-elevated)',
            color: 'var(--text-secondary)',
            border: '1px solid var(--border)'
          }}
        >
          Open in Advanced Builder
        </button>
      </div>
    </div>
  )
}

function ReviewSection({
  icon: Icon,
  title,
  onEdit,
  children
}: {
  icon: React.ElementType
  title: string
  onEdit: () => void
  children: React.ReactNode
}) {
  return (
    <div className="surface-panel p-5" data-panel>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Icon size={16} style={{ color: 'var(--accent)' }} />
          <h3 className="text-section-heading font-heading" style={{ color: 'var(--text-primary)' }}>
            {title}
          </h3>
        </div>
        <EditLink onClick={onEdit} />
      </div>
      <div>{children}</div>
    </div>
  )
}

function EditLink({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="text-small transition-colors"
      style={{ color: 'var(--accent)' }}
    >
      Edit
    </button>
  )
}
