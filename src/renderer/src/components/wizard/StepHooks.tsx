import { Plus, Trash2 } from 'lucide-react'
import { nanoid } from 'nanoid'
import type { HookRule, HookEvent, HookType } from '@/types/plugin'

interface StepHooksProps {
  rules: HookRule[]
  onAdd: () => void
  onUpdate: (id: string, changes: Partial<HookRule>) => void
  onRemove: (id: string) => void
}

const triggerOptions: Array<{ label: string; event: HookEvent; matcher?: string }> = [
  { label: 'After Claude writes/edits a file', event: 'PostToolUse', matcher: 'Write|Edit' },
  { label: 'Before Claude runs a command', event: 'PreToolUse', matcher: 'Bash' },
  { label: 'When Claude finishes a task', event: 'Stop' }
]

const actionOptions: Array<{ label: string; hookType: HookType }> = [
  { label: 'Show a warning message', hookType: 'prompt' },
  { label: 'Run a check', hookType: 'command' },
  { label: 'Ask an agent to review', hookType: 'agent' }
]

export function StepHooks({ rules, onAdd, onUpdate, onRemove }: StepHooksProps) {
  return (
    <div className="max-w-2xl mx-auto p-8 space-y-6">
      <div>
        <h2 className="text-page-title font-heading mb-2" style={{ color: 'var(--text-primary)' }}>
          Set up automatic triggers
        </h2>
        <p className="text-body" style={{ color: 'var(--text-secondary)' }}>
          Hooks fire automatically when certain events happen. They're guardrails and automation.
        </p>
      </div>

      <div className="space-y-4">
        {rules.map((rule, index) => (
          <div key={rule.id} className="surface-panel p-5 space-y-4" data-panel>
            <div className="flex items-center justify-between">
              <span className="text-section-heading font-heading" style={{ color: 'var(--text-primary)' }}>
                Hook {index + 1}
              </span>
              <button onClick={() => onRemove(rule.id)} className="p-1 rounded" style={{ color: 'var(--text-muted)' }}>
                <Trash2 size={14} />
              </button>
            </div>

            <div>
              <label className="block text-body font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                When should this trigger?
              </label>
              <select
                value={`${rule.event}|${rule.matcher || ''}`}
                onChange={(e) => {
                  const [event, matcher] = e.target.value.split('|')
                  onUpdate(rule.id, { event: event as HookEvent, matcher: matcher || undefined })
                }}
                className="w-full h-9"
              >
                {triggerOptions.map((opt) => (
                  <option key={opt.label} value={`${opt.event}|${opt.matcher || ''}`}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-body font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                What should happen?
              </label>
              <select
                value={rule.hookType}
                onChange={(e) => onUpdate(rule.id, { hookType: e.target.value as HookType })}
                className="w-full h-9"
              >
                {actionOptions.map((opt) => (
                  <option key={opt.hookType} value={opt.hookType}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {rule.hookType === 'prompt' && (
              <div>
                <label className="block text-body font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                  Warning / check message
                </label>
                <textarea
                  value={rule.prompt || ''}
                  onChange={(e) => onUpdate(rule.id, { prompt: e.target.value })}
                  placeholder="Check if the code follows our standards..."
                  className="w-full h-20 resize-none"
                  rows={3}
                />
              </div>
            )}

            {rule.hookType === 'command' && (
              <div>
                <label className="block text-body font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                  Command to run
                </label>
                <input
                  type="text"
                  value={rule.command || ''}
                  onChange={(e) => onUpdate(rule.id, { command: e.target.value })}
                  placeholder='node "${CLAUDE_PLUGIN_ROOT}/scripts/check.js"'
                  className="w-full h-9 font-mono text-code"
                />
              </div>
            )}

            {rule.hookType === 'agent' && (
              <div>
                <label className="block text-body font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                  Agent name
                </label>
                <input
                  type="text"
                  value={rule.agentName || ''}
                  onChange={(e) => onUpdate(rule.id, { agentName: e.target.value })}
                  placeholder="my-reviewer-agent"
                  className="w-full h-9"
                />
              </div>
            )}
          </div>
        ))}
      </div>

      <button
        onClick={onAdd}
        className="flex items-center gap-2 text-body px-4 py-2 rounded transition-colors w-full justify-center"
        style={{ backgroundColor: 'var(--bg-elevated)', color: 'var(--text-secondary)', border: '1px dashed var(--border)' }}
      >
        <Plus size={16} />
        Add another hook
      </button>
    </div>
  )
}
